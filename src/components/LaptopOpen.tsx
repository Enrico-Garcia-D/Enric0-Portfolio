import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createStage, webglAvailable } from '../laptop/stage'

/*
 * Between the hero and the laptop display: a closed laptop whose lid opens on scroll while the camera swings round
 * to face the screen. It ends on exactly the pose the pinned display frame starts from (same lid, same crop of the
 * top bezel), so the page then continues "inside" the screen without a visible seam.
 */

const FOV = 32
const LID_W = 6.4
const LID_H = 3.98
const TOP_BEZEL = 0.25 // keep in sync with LaptopViewer
const OPEN_DEG = 100
const CLOSED_DEG = 0

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export default function LaptopOpen() {
  const wrap = useRef<HTMLDivElement>(null)
  const stageEl = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [ok] = useState(() => webglAvailable() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (!ok) return
    const wrapEl = wrap.current!
    const stageNode = stageEl.current!
    const stage = createStage(host.current!)
    const { camera, laptop, floor } = stage

    // a desk for the laptop to sit on: soft-edged dark surface just under the base, catching its shadow
    floor.position.y = -0.004
    const dc = document.createElement('canvas')
    dc.width = dc.height = 256
    const dx = dc.getContext('2d')!
    const dg = dx.createRadialGradient(128, 128, 20, 128, 128, 128)
    dg.addColorStop(0, '#fff')
    dg.addColorStop(0.55, '#ddd')
    dg.addColorStop(1, '#000')
    dx.fillStyle = dg
    dx.fillRect(0, 0, 256, 256)
    const desk = new THREE.Mesh(
      new THREE.CircleGeometry(15, 64).rotateX(-Math.PI / 2).translate(0, -0.006, 0),
      new THREE.MeshStandardMaterial({ color: 0x0d0f13, alphaMap: new THREE.CanvasTexture(dc), transparent: true, roughness: 0.75, metalness: 0, envMapIntensity: 0.15 }),
    )
    desk.receiveShadow = true
    stage.scene.add(desk)

    // dark, switched-off display (matches the dark page inside the screen)
    laptop.parts
      .find((p) => p.id === 'd-panel')
      ?.g.traverse((o: THREE.Object3D) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (m && m.emissiveMap) {
          m.emissiveIntensity = 0.03
          m.roughness = 1
        }
      })
    laptop.lid.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(6.2, 3.48).translate(0, 1.99, -0.035),
        new THREE.MeshBasicMaterial({ color: 0x04060c, toneMapped: false }),
      ),
    )

    // final pose: lid open, filling the window with the top bezel cropped (same maths as the display frame)
    laptop.layout(0, OPEN_DEG)
    const tgtA = new THREE.Vector3(0, 1.99, 0).applyMatrix4(laptop.lid.matrixWorld)
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(laptop.lid.matrixWorld)

    const posA = new THREE.Vector3()
    const posS = new THREE.Vector3()
    const tgtS = new THREE.Vector3()
    const pos = new THREE.Vector3()
    const tgt = new THREE.Vector3()

    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(wrapEl)

    const progress = () => {
      const span = wrapEl.offsetHeight - stageNode.offsetHeight
      return span > 0 ? clamp01(-wrapEl.getBoundingClientRect().top / span) : 0
    }

    const apply = (p: number) => {
      const { w, h } = stage.size
      const t = Math.tan(THREE.MathUtils.degToRad(FOV) / 2)
      const pxPerUnit = Math.max(w / LID_W, h / (LID_H - TOP_BEZEL))
      const finalDist = h / (2 * t * pxPerUnit)
      posA.copy(tgtA).addScaledVector(normal, finalDist)
      const startY = Math.max(0, (LID_H * pxPerUnit - h) / 2)

      // closed on a desk, seen from the front and a little above; the lid opens while the camera glides in to the screen
      const k = Math.max(1, 1.2 / camera.aspect)
      posS.set(0, 7.6 * k, 12.6 * k)
      tgtS.set(0, 0.2, 0)
      const open = smooth(0.03, 0.985, p)
      const move = smooth(0.08, 0.99, p)
      laptop.layout(0, CLOSED_DEG + (OPEN_DEG - CLOSED_DEG) * open)
      pos.copy(posS).lerp(posA, move)
      tgt.copy(tgtS).lerp(tgtA, move)
      camera.position.copy(pos)
      camera.lookAt(tgt)
      camera.setViewOffset(w, h, 0, startY * move, w, h)
    }

    // The display zone overlaps the end of this pinned block. Its own bezel/chrome only turn on once it has reached
    // the top, so until then the opened lid you see is this one, and About simply scrolls up onto its screen.
    const zone = wrapEl.nextElementSibling as HTMLElement | null
    const live = () => {
      if (!zone) return
      const top = zone.getBoundingClientRect().top
      const isLive = top <= 1
      zone.classList.toggle('zone-live', isLive)
      if (isLive) {
        zone.style.clipPath = ''
        return
      }
      // until then, only show the rising content inside the screen window (never over the bezel or the HP logo)
      const x = parseFloat(zone.style.getPropertyValue('--win-x')) || 22
      const b = parseFloat(zone.style.getPropertyValue('--win-b')) || 54
      const cut = stageNode.offsetHeight - b - top
      zone.style.clipPath = `inset(0 ${x}px calc(100% - ${Math.max(0, cut)}px) ${x}px)`
    }
    window.addEventListener('scroll', live, { passive: true })
    window.addEventListener('resize', live)
    live()

    let cur = progress()
    let lastP = -1
    // resizing clears the canvas, so force a redraw
    const redraw = () => {
      lastP = -1
    }
    const roRedraw = new ResizeObserver(redraw)
    roRedraw.observe(stageNode)
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible) return
      cur += (progress() - cur) * (1 - Math.exp(-dt * 9))
      // nothing moves unless the scroll position does, so skip identical frames
      if (Math.abs(cur - lastP) < 1e-4) return
      lastP = cur
      apply(cur)
      stage.markShadows()
      stage.render()
    }
    apply(cur)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      roRedraw.disconnect()
      window.removeEventListener('scroll', live)
      window.removeEventListener('resize', live)
      zone?.classList.remove('zone-live')
      if (zone) zone.style.clipPath = ''
      stage.dispose()
    }
  }, [ok])

  if (!ok) return null
  return (
    <div className="lid-open" ref={wrap} aria-hidden="true">
      <div className="lid-open-stage" ref={stageEl}>
        <div className="lid-open-canvas" ref={host} />
      </div>
    </div>
  )
}
