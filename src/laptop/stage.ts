import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { createLaptop } from './model'

export type Laptop = ReturnType<typeof createLaptop>

/** Camera pose used by the full-laptop view (3/4 from front-right). */
export const HOME = { pos: new THREE.Vector3(13, 4.6, 12.5), tgt: new THREE.Vector3(0, 0.9, -0.9) }

/** True when the browser can create a WebGL context (checked once, on a throwaway canvas). */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * A transparent WebGL canvas holding the lit laptop. Both the scroll intro and the interactive viewer
 * build on this; they only differ in how they drive the camera and `laptop.layout`.
 */
export function createStage(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  // supersample for crisp edges, but cap the total pixel count so large or high-density screens stay smooth
  // (phones and tablets also cap lower: a coarse pointer means a smaller GPU budget)
  const lowPower = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const pixelRatio = (w: number, h: number) =>
    Math.max(1, Math.min(lowPower ? 1.5 : 2, Math.max(window.devicePixelRatio, 1.25), Math.sqrt((lowPower ? 1_800_000 : 2_800_000) / (w * h))))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  // shadows are static unless the laptop moves, so they are only re-rendered on request (markShadows)
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  renderer.domElement.style.display = 'block'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()
  scene.environmentIntensity = 0.55

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120)
  camera.position.copy(HOME.pos)

  const sun = new THREE.DirectionalLight(0xffffff, 2.2)
  sun.position.set(6, 12, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 })
  sun.shadow.bias = -0.0004
  scene.add(sun, new THREE.HemisphereLight(0xbcd8ee, 0x10161d, 0.6))
  const under = new THREE.DirectionalLight(0xdfe9f2, 3.4)
  under.position.set(5, -12, 8)
  const under2 = new THREE.DirectionalLight(0xdfe9f2, 2.2)
  under2.position.set(-6, -10, -7)
  const back = new THREE.DirectionalLight(0xffffff, 2.2)
  back.position.set(2, 5, -14)
  const rim = new THREE.DirectionalLight(0x8fb8d4, 0.6)
  rim.position.set(-8, 5, -8)
  scene.add(under, under2, back, rim)

  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 72), new THREE.ShadowMaterial({ opacity: 0.35 }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.75
  floor.receiveShadow = true
  scene.add(floor)

  const laptop = createLaptop()
  scene.add(laptop.root)
  // Mirror-chrome parts (the lid's HP mark) get the studio environment at full strength, independent of the scene's
  // dimmer overall environment, so they read as polished metal rather than dark grey.
  laptop.root.traverse((o: THREE.Object3D) => {
    const mesh = o as THREE.Mesh
    if (mesh.userData.mirror && mesh.material) {
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.envMap = scene.environment
      mat.envMapIntensity = 3
      mat.needsUpdate = true
    }
  })

  const size = { w: 1, h: 1 }
  const resize = () => {
    const w = Math.max(1, host.clientWidth)
    const h = Math.max(1, host.clientHeight)
    size.w = w
    size.h = h
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(pixelRatio(w, h))
    renderer.setSize(w, h)
    renderer.shadowMap.needsUpdate = true
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  const spin = (dt: number) => {
    for (const r of laptop.rotors) r.rotation.y += dt * 9
  }

  return {
    renderer,
    scene,
    camera,
    floor,
    laptop,
    size,
    spin,
    markShadows: () => {
      renderer.shadowMap.needsUpdate = true
    },
    render: () => renderer.render(scene, camera),
    dispose() {
      ro.disconnect()
      laptop.dispose()
      floor.geometry.dispose()
      ;(floor.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
