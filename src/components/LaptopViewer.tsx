import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { HOME, createStage, webglAvailable } from '../laptop/stage'

/*
 * The laptop section. It continues straight out of the display: the DOM bezel (pinned over the zone) fades away,
 * the 3D laptop's own display is framed to exactly the same window, and scrolling pulls the camera back until
 * the whole laptop is in view. At that point the same canvas becomes interactive and the info panels,
 * parts list and Explode control fade in over it.
 */

interface PartMeta {
  id: string
  name: string
  cat: string
  tag: 'CSR' | 'ASP'
  pn: string
  pg: string
  desc: string
  svc: string
}

interface Api {
  select: (id: string | null) => void
  setAmount: (v: number) => void
  setHidden: (id: string, hidden: boolean) => void
  setZoom: (v: number) => void
  setLid: (v: number) => void
}

const CATS = ['Display assembly', 'Top cover & input', 'Main board & cooling', 'Memory & storage', 'Wireless', 'Power', 'I/O & audio', 'Base']
const EXPLODE_DEFAULT = 0.85
const ZOOM_MIN = 0.6 // 1 = the framing the laptop arrives in
const ZOOM_MAX = 2.4

const FOV = 32
const SCREEN_W = 6.2
const SCREEN_H = 3.48
const LID_DEG = 100
const LID_MIN = 0
const LID_MAX = 135
const PANEL_SHIFT = 190 // px the laptop is nudged left to make room for the side panels (wide screens)

// Scroll phases, as a fraction of the pinned runway
const FRAME_FADE: [number, number] = [0.03, 0.12]
const PULL: [number, number] = [0.1, 0.56]
const WAKE: [number, number] = [0.2, 0.45]
const UI_IN: [number, number] = [0.52, 0.66]
const INTERACTIVE_FROM = 0.6

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const LID_W = 6.4
const LID_H = 3.98
const TOP_BEZEL = 0.25 // scene units of bezel above the display; cropped off the top of the window at the start

export default function LaptopViewer() {
  const wrap = useRef<HTMLElement>(null)
  const stageEl = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const ui = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)
  const [supported] = useState(webglAvailable)
  const [parts, setParts] = useState<PartMeta[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [sub, setSub] = useState<string | null>(null)
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())
  const [amount, setAmount] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [lidAngle, setLidAngle] = useState(LID_DEG)

  useEffect(() => {
    if (!supported) return
    const wrapEl = wrap.current!
    const stageNode = stageEl.current!
    const hostEl = host.current!
    const tipEl = tip.current!
    const zone = wrapEl.closest<HTMLElement>('.screen-zone')
    const stage = createStage(hostEl)
    const { camera, laptop, renderer } = stage

    setParts(laptop.parts.map(({ id, name, cat, tag, pn, pg, desc, svc }) => ({ id, name, cat, tag, pn, pg, desc, svc })))

    // ---- display "wake-up": starts as a dark sheet in the page's colour so the hand-over from the DOM display is invisible
    const panelMats: THREE.MeshStandardMaterial[] = []
    laptop.parts
      .find((p) => p.id === 'd-panel')
      ?.g.traverse((o: THREE.Object3D) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (m && m.emissiveMap) panelMats.push(m)
      })
    const EMISSIVE = panelMats[0]?.emissiveIntensity ?? 0.9
    const GLOSS = panelMats[0]?.roughness ?? 0.15
    const cover = new THREE.Mesh(
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H).translate(0, 1.99, -0.035),
      new THREE.MeshBasicMaterial({ color: 0x04060c, transparent: true, toneMapped: false }),
    )
    laptop.lid.add(cover)

    // The lid's assembled pose never changes, so measure it once. (poses() must not call layout(): that would snap
    // an exploded laptop back together instead of letting it reassemble smoothly.)
    laptop.layout(0, LID_DEG)
    const tgt0 = new THREE.Vector3(0, 1.99, 0).applyMatrix4(laptop.lid.matrixWorld)
    const normal0 = new THREE.Vector3(0, 0, 1).transformDirection(laptop.lid.matrixWorld)

    // ---- camera poses
    const tmp = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const posA = new THREE.Vector3()
    const tgtA = new THREE.Vector3()
    const posC = new THREE.Vector3()
    const pos = new THREE.Vector3()
    const tgt = new THREE.Vector3()

    /**
     * posA/tgtA: the lid face on, scaled so its side bezels meet the window edges, with the lid's bottom edge on the
     * bottom of the window; the top bezel is cropped off the top. No stretching. Returns the vertical view offset (px)
     * that does the bottom-alignment. posC: the whole laptop.
     */
    let lastPxu = 0
    const poses = () => {
      const { w, h } = stage.size
      tgtA.copy(tgt0)
      normal.copy(normal0)
      const t = Math.tan(THREE.MathUtils.degToRad(FOV) / 2)
      const pxPerUnit = Math.max(w / LID_W, h / (LID_H - TOP_BEZEL))
      const dist = h / (2 * t * pxPerUnit)
      posA.copy(tgtA).addScaledVector(normal, dist)
      if (pxPerUnit !== lastPxu && zone) {
        lastPxu = pxPerUnit
        zone.style.setProperty('--win-x', `${((LID_W - SCREEN_W) / 2) * pxPerUnit}px`)
        zone.style.setProperty('--win-b', `${TOP_BEZEL * pxPerUnit}px`)
      }
      const k = Math.max(1, 1.2 / camera.aspect)
      posC.copy(HOME.tgt).add(tmp.copy(HOME.pos).sub(HOME.tgt).multiplyScalar(k))
      return Math.max(0, (LID_H * pxPerUnit - h) / 2)
    }

    /**
     * Renders the model's own bezel from the starting pose and hands it to the page as the frame around the display:
     * real webcam, HP mark and rounded corners. The display itself stays transparent; everything outside the lid is
     * the page's dark. Because the live scene starts from the same pose, the swap to 3D is seamless.
     */
    const snapshotFrame = () => {
      if (interactive || !zone || ex !== 0) return
      const { w, h } = stage.size
      const startY = poses()
      pos.copy(posA)
      camera.position.copy(pos)
      camera.lookAt(tgtA)
      camera.setViewOffset(w, h, 0, startY, w, h)

      const saved = laptop.parts.map((p) => p.g.visible)
      const coverWas = cover.visible
      const op = cover.material.opacity
      const renderOnly = (show: (id: string) => boolean, showCover: boolean) => {
        laptop.parts.forEach((p) => (p.g.visible = show(p.id)))
        cover.visible = showCover
        cover.material.opacity = 1
        laptop.guides.visible = false
        stage.render()
        const c = document.createElement('canvas')
        c.width = renderer.domElement.width
        c.height = renderer.domElement.height
        const g = c.getContext('2d')!
        g.drawImage(renderer.domElement, 0, 0)
        return g.getImageData(0, 0, c.width, c.height)
      }
      const bezelPx = renderOnly((id) => id === 'd-bezel', false)
      const panelPx = renderOnly(() => false, true)
      laptop.parts.forEach((p, i) => (p.g.visible = saved[i]))
      cover.visible = coverWas
      cover.material.opacity = op

      const out = document.createElement('canvas')
      out.width = bezelPx.width
      out.height = bezelPx.height
      const og = out.getContext('2d')!
      const o = og.createImageData(out.width, out.height)
      const A = bezelPx.data
      const P = panelPx.data
      const D = 0x0b
      for (let i = 0; i < A.length; i += 4) {
        const a = A[i + 3] / 255
        const bg = 1 - P[i + 3] / 255 // page-dark outside the lid, transparent inside the display hole
        const oa = a + (1 - a) * bg
        if (oa > 0) {
          o.data[i] = (A[i] * a + D * (1 - a) * bg) / oa
          o.data[i + 1] = (A[i + 1] * a + D * (1 - a) * bg) / oa
          o.data[i + 2] = (A[i + 2] * a + D * (1 - a) * bg) / oa
          o.data[i + 3] = oa * 255
        }
      }
      og.putImageData(o, 0, 0)
      zone.style.setProperty('--frame-img', `url(${out.toDataURL('image/png')})`)
      zone.classList.add('frame-3d')
      frameFor = `${w}x${h}`
    }
    let frameFor = ''
    const sideRoom = () => (stage.size.w > 900 ? PANEL_SHIFT : 0)

    // ---- orbit (enabled only once the camera has arrived)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enableZoom = false // the wheel belongs to the page
    controls.enablePan = false
    controls.maxPolarAngle = Math.PI * 0.98
    controls.enabled = false
    renderer.domElement.style.touchAction = 'pan-y' // keep vertical swipes scrolling the page

    let ex = 0
    let exTarget = 0
    let zoom = 1
    let zoomTarget = 1
    let lidDeg = LID_DEG
    let lidTarget = LID_DEG
    let baseDist = 1
    let focus: THREE.Vector3 | null = null
    let sel: (typeof laptop.parts)[number] | null = null
    let interactive = false

    const byId = (id: string) => laptop.parts.find((p) => p.id === id) ?? null
    const labelOf = (obj: THREE.Object3D) => {
      let o: THREE.Object3D | null = obj
      while (o && !o.userData.label) o = o.parent
      return o ? (o.userData.label as string) : null
    }
    const select = (p: typeof sel, subLabel: string | null = null, doFocus = false) => {
      sel = p
      laptop.paint(p)
      setSelected(p ? p.id : null)
      setSub(subLabel)
      if (p && doFocus) focus = laptop.centre(p)
    }

    api.current = {
      select: (id) => select(id ? byId(id) : null, null, true),
      setAmount: (v) => {
        exTarget = v
      },
      setZoom: (v) => {
        zoomTarget = v
      },
      setLid: (v) => {
        lidTarget = v
      },
      setHidden: (id, h) => {
        const p = byId(id)
        if (p) p.g.visible = !h
        stage.markShadows()
      },
    }

    // ---- picking
    const ray = new THREE.Raycaster()
    const ptr = new THREE.Vector2()
    const pick = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ptr, camera)
      return ray.intersectObjects(laptop.parts.filter((p) => p.g.visible).map((p) => p.g), true)[0] ?? null
    }
    let down: [number, number] | null = null
    const onDown = (e: PointerEvent) => (down = [e.clientX, e.clientY])
    const onUp = (e: PointerEvent) => {
      if (!interactive || !down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return
      const h = pick(e)
      if (h) select(h.object.userData.part, labelOf(h.object))
      else select(null)
    }
    let queued = false
    let lastMove: PointerEvent | null = null
    const onMove = (e: PointerEvent) => {
      lastMove = e
      if (queued || !interactive) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        if (!lastMove) return
        const h = pick(lastMove)
        if (h) {
          const box = hostEl.getBoundingClientRect()
          tipEl.textContent = labelOf(h.object) ?? h.object.userData.part.name
          tipEl.style.display = 'block'
          tipEl.style.left = `${lastMove.clientX - box.left + 14}px`
          tipEl.style.top = `${lastMove.clientY - box.top + 14}px`
          renderer.domElement.style.cursor = 'pointer'
        } else {
          tipEl.style.display = 'none'
          renderer.domElement.style.cursor = 'grab'
        }
      })
    }
    const onLeave = () => {
      tipEl.style.display = 'none'
    }
    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onDown)
    dom.addEventListener('pointerup', onUp)
    dom.addEventListener('pointermove', onMove)
    dom.addEventListener('pointerleave', onLeave)

    // ---- scroll-driven frame loop
    let visible = false
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(wrapEl)

    const progress = () => {
      const span = wrapEl.offsetHeight - stageNode.offsetHeight
      return span > 0 ? clamp01(-wrapEl.getBoundingClientRect().top / span) : 0
    }

    const enterInteractive = () => {
      interactive = true
      controls.enabled = true
      controls.target.copy(HOME.tgt)
      baseDist = camera.position.distanceTo(HOME.tgt)
      renderer.domElement.style.cursor = 'grab'
    }
    const fromPos = new THREE.Vector3()
    const fromTgt = new THREE.Vector3()
    let fromViewX = 0
    let blend = 0
    const leaveInteractive = () => {
      interactive = false
      controls.enabled = false
      focus = null
      tipEl.style.display = 'none'
      // scrolling back up: the laptop reassembles smoothly (see the explode step in apply) and the camera eases from
      // wherever it was orbited to back onto the scripted path
      if (exTarget !== 0) {
        exTarget = 0
        setAmount(0)
      }
      if (lidTarget !== LID_DEG) {
        lidTarget = LID_DEG
        setLidAngle(LID_DEG)
      }
      if (zoomTarget !== 1 || zoom !== 1) {
        zoomTarget = 1
        zoom = 1
        setZoom(1)
      }
      fromPos.copy(camera.position)
      fromTgt.copy(controls.target)
      fromViewX = sideRoom()
      blend = 1
      if (sel) select(null)
    }

    const apply = (p: number, dt: number) => {
      const wake = smooth(WAKE[0], WAKE[1], p)
      for (const m of panelMats) {
        m.emissiveIntensity = 0.03 + (EMISSIVE - 0.03) * wake
        m.roughness = 1 + (GLOSS - 1) * wake // matte while it is the page, glossy glass once it is a laptop
      }
      cover.material.opacity = 1 - wake
      cover.visible = wake < 0.995

      const frameO = 1 - smooth(FRAME_FADE[0], FRAME_FADE[1], p)
      zone?.style.setProperty('--frame-o', String(frameO))
      zone?.style.setProperty('--frame-v', frameO < 0.02 ? 'hidden' : 'visible')
      if (glow.current) glow.current.style.opacity = String(smooth(0.15, 0.5, p))

      const uiO = smooth(UI_IN[0], UI_IN[1], p)
      if (ui.current) {
        ui.current.style.opacity = String(uiO)
        ui.current.style.visibility = uiO < 0.01 ? 'hidden' : 'visible'
      }

      const wantInteractive = p >= INTERACTIVE_FROM
      if (wantInteractive && !interactive) enterInteractive()
      if (!wantInteractive && interactive) leaveInteractive()

      const { w, h } = stage.size
      const pull = smooth(PULL[0], PULL[1], p)

      // explode / reassemble (runs in both modes, so scrolling back up puts the laptop together smoothly)
      let dolly = false
      let relayout = false
      if (Math.abs(exTarget - ex) > 0.0005) {
        ex += (exTarget - ex) * (1 - Math.exp(-dt * 6))
        if (Math.abs(exTarget - ex) <= 0.0005) ex = exTarget
        relayout = true
        dolly = true
      }
      if (Math.abs(lidTarget - lidDeg) > 0.01) {
        lidDeg += (lidTarget - lidDeg) * (1 - Math.exp(-dt * 8))
        if (Math.abs(lidTarget - lidDeg) <= 0.01) lidDeg = lidTarget
        relayout = true
      }
      if (relayout) {
        laptop.layout(ex, lidDeg)
        stage.markShadows()
        laptop.updateGuides(ex, lidDeg)
      }
      if (Math.abs(zoomTarget - zoom) > 0.0005) {
        zoom += (zoomTarget - zoom) * (1 - Math.exp(-dt * 8))
        if (Math.abs(zoomTarget - zoom) <= 0.0005) zoom = zoomTarget
        dolly = true
      }
      if (dolly && interactive) {
        // distance = how far the exploded laptop needs, divided by the zoom the slider asks for
        const off = camera.position.clone().sub(controls.target)
        off.setLength((baseDist * (1 + 0.3 * ex)) / zoom)
        camera.position.copy(controls.target).add(off)
      }

      if (!interactive) {
        const startY = poses()
        // only show the live scene once it is pinned exactly under the frame, so the two never appear side by side
        stageNode.style.visibility = wrapEl.getBoundingClientRect().top <= 1 ? 'visible' : 'hidden'
        pos.copy(posA).lerp(posC, pull)
        tgt.copy(tgtA).lerp(HOME.tgt, pull)
        let viewX = sideRoom() * pull
        if (blend > 0) {
          blend = Math.max(0, blend - dt / 0.9)
          const e = blend * blend * (3 - 2 * blend)
          pos.lerp(fromPos, e)
          tgt.lerp(fromTgt, e)
          viewX += (fromViewX - viewX) * e
        }
        camera.position.copy(pos)
        camera.lookAt(tgt)
        camera.setViewOffset(w, h, viewX, startY * (1 - pull), w, h)
        return
      }

      // interactive: orbit
      blend = 0
      stageNode.style.visibility = 'visible'
      camera.setViewOffset(w, h, sideRoom(), 0, w, h)
      if (focus) {
        controls.target.lerp(focus, 0.1)
        if (controls.target.distanceTo(focus) < 0.02) focus = null
      }
      controls.update()
    }

    let disposed = false
    snapshotFrame()
    // the logo textures load asynchronously; re-take the frame once they are in
    laptop.ready.then(() => {
      if (!disposed) snapshotFrame()
    })
    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (`${stage.size.w}x${stage.size.h}` !== frameFor) snapshotFrame()
      }, 250)
    })
    ro.observe(hostEl)

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
      // when idle on the scripted path (not orbiting, nothing animating, scroll still) there is nothing new to draw
      const animating =
        interactive || blend > 0 || Math.abs(exTarget - ex) > 0.0005 || Math.abs(lidTarget - lidDeg) > 0.01 || Math.abs(zoomTarget - zoom) > 0.0005
      if (!animating && Math.abs(cur - lastP) < 1e-4 && lastP >= 0) return
      lastP = cur
      apply(cur, dt)
      if (interactive) stage.spin(dt)
      stage.render()
    }
    apply(cur, 0)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      roRedraw.disconnect()
      dom.removeEventListener('pointerdown', onDown)
      dom.removeEventListener('pointerup', onUp)
      dom.removeEventListener('pointermove', onMove)
      dom.removeEventListener('pointerleave', onLeave)
      disposed = true
      ro.disconnect()
      window.clearTimeout(resizeTimer)
      zone?.style.removeProperty('--frame-o')
      zone?.style.removeProperty('--frame-v')
      zone?.style.removeProperty('--win-x')
      zone?.style.removeProperty('--win-b')
      zone?.style.removeProperty('--frame-img')
      zone?.classList.remove('frame-3d')
      controls.dispose()
      stage.dispose()
      api.current = null
    }
  }, [supported])

  useEffect(() => api.current?.setAmount(amount), [amount])
  useEffect(() => api.current?.setZoom(zoom), [zoom])
  useEffect(() => api.current?.setLid(lidAngle), [lidAngle])

  const toggleHidden = (id: string) => {
    const next = new Set(hidden)
    const nowHidden = !next.delete(id)
    if (nowHidden) next.add(id)
    setHidden(next)
    api.current?.setHidden(id, nowHidden)
  }

  if (!supported) return null
  const part = parts.find((p) => p.id === selected) ?? null

  return (
    <section className="laptop-section" ref={wrap} aria-label="HP ProBook 445 G10, interactive 3D model">
      <div className="ls-stage" ref={stageEl}>
        <div className="ls-glow" ref={glow} aria-hidden="true" />
        <div className="ls-canvas" ref={host} />
        <div className="ls-tip" ref={tip} />

        <div className="ls-ui" ref={ui}>
          <h2 className="ls-title">My Device</h2>
          <div className="ls-controls">
            <button
              type="button"
              className="btn btn-solid"
              aria-pressed={amount > 0}
              onClick={() => setAmount(amount > 0 ? 0 : EXPLODE_DEFAULT)}
            >
              {amount > 0 ? 'Assemble' : 'Explode'}
            </button>
            <label className="lv-slider">
              <span>Spread</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                aria-label="Explode amount"
              />
            </label>
            <label className="lv-slider">
              <span>Lid</span>
              <input
                type="range"
                min={LID_MIN}
                max={LID_MAX}
                step={1}
                value={lidAngle}
                onChange={(e) => setLidAngle(Number(e.target.value))}
                aria-label="Screen lid angle"
              />
            </label>
            <label className="lv-slider">
              <span>Zoom</span>
              <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
            </label>
          </div>

          <div className="ls-side">
            <div className="panel lv-info" aria-live="polite">
              <div className="panel-head">
                <span>{part ? 'component' : 'overview'}</span>
                <span>{part ? `guide p.${part.pg}` : 'HP ProBook 445 G10'}</span>
              </div>
              <div className="lv-info-body">
                {part ? (
                  <>
                    <h3 className="lv-name">
                      {part.name} <span className={`lv-tag ${part.tag}`}>{part.tag}</span>
                    </h3>
                    <p className="lv-pn">Spare part {part.pn}</p>
                    {sub && <p className="lv-sub">{sub}</p>}
                    <p dangerouslySetInnerHTML={{ __html: part.desc }} />
                    <p className="lv-svc" dangerouslySetInnerHTML={{ __html: part.svc }} />
                  </>
                ) : (
                  <>
                    <h3 className="lv-name">HP ProBook 445 G10</h3>
                    <p className="lv-pn">Drag to orbit · click a part</p>
                    <p>
                      Chassis 321.9 × 213.9 × 19.95 mm · 1.38 kg · 14″ display · AMD Ryzen 7000U · Radeon graphics · 2 × DDR4-3200 SODIMM ·
                      M.2 2280 + 2230 NVMe · Wi-Fi 6E / BT 5.3 · optional LTE · HDMI 2.1, USB-C (10 Gbps, DP out), 3 × USB-A, RJ-45.
                    </p>
                    <p className="lv-svc">
                      <span className="lv-tag CSR">CSR</span> customer self-repair <span className="lv-tag ASP">ASP</span> authorised service
                      provider only.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="panel lv-list">
              <div className="panel-head">
                <span>parts</span>
                <span>{parts.length}</span>
              </div>
              <div className="lv-list-body">
                {CATS.map((cat) => {
                  const inCat = parts.filter((p) => p.cat === cat)
                  if (!inCat.length) return null
                  return (
                    <div key={cat}>
                      <p className="lv-group">{cat}</p>
                      {inCat.map((p) => (
                        <div key={p.id} className={`lv-row${p.id === selected ? ' sel' : ''}`}>
                          <button type="button" className="lv-part" onClick={() => api.current?.select(p.id)}>
                            <span>
                              {p.name} <span className={`lv-tag ${p.tag}`}>{p.tag}</span>
                            </span>
                            <small>{p.pn}</small>
                          </button>
                          <button
                            type="button"
                            className={`lv-eye${hidden.has(p.id) ? ' off' : ''}`}
                            aria-label={`${hidden.has(p.id) ? 'Show' : 'Hide'} ${p.name}`}
                            aria-pressed={hidden.has(p.id)}
                            onClick={() => toggleHidden(p.id)}
                          >
                            ◉
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
