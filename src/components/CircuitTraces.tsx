import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

interface Trace {
  d: string
  /** DOM index of the chip this line feeds; the decorative CPU lines have none. */
  chip?: number

  delay: number
  duration: number
}

interface Props {
  board: RefObject<HTMLElement | null>
  cpu: RefObject<HTMLElement | null>
  chips: RefObject<HTMLElement | null>
  /** Pin count of each chip, in DOM order. Chips draw pins/4 pins per side. */
  pins: number[]
}

type Pt = [number, number]

const BEND = 6 // size of the 45° chamfer at each corner
const LEVEL_GAP = 4 // vertical spacing between the horizontal bus lines
const MAX_BUS_DEPTH = 56
const SPOT_RADIUS = 90 // reach of the cursor spotlight, in px
const LANE_GAP = 2.2 // spacing between a chip's lines while they run down the gap beside it
// Chip art is drawn in a 200 unit box: top pins sit at x = 50..150 and their tips at y = 18..33.
const PIN_TIP = 12 / 100 // fraction of the chip height where a line meets the top pins
const LANE_SPAN = 14 // vertical room, in px, for one chip's lines in the channel above its row

/** Joins the points with 45° chamfered corners. */
function chamfer(raw: Pt[]): string {
  const pts = raw.filter((p, i) => i === 0 || p[0] !== raw[i - 1][0] || p[1] !== raw[i - 1][1])
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]
    const [x, y] = pts[i]
    const [nx, ny] = pts[i + 1]
    const inLen = Math.abs(x - px) + Math.abs(y - py)
    const outLen = Math.abs(nx - x) + Math.abs(ny - y)
    const r = Math.min(BEND, inLen / 2, outLen / 2)
    d += `L${x - Math.sign(x - px) * r} ${y - Math.sign(y - py) * r}`
    d += `L${x + Math.sign(nx - x) * r} ${y + Math.sign(ny - y) * r}`
  }
  const last = pts[pts.length - 1]
  return `${d}L${last[0]} ${last[1]}`
}

/**
 * Glowing circuit lines that run from the CPU (the portrait) to every top pin of every tech chip.
 * Lines leave the CPU once per chip, travel down the gap beside the chip, turn into the channel above
 * its row and finish under each pin. Geometry is measured from the DOM so it follows the layout.
 */
export default function CircuitTraces({ board, cpu, chips, pins }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [traces, setTraces] = useState<Trace[]>([])
  const [decor, setDecor] = useState<Trace[]>([])
  const spot = useRef<SVGRadialGradientElement>(null)
  const [fade, setFade] = useState({ x: 0, y: 0, r: 1 })

  useLayoutEffect(() => {
    const boardEl = board.current
    const cpuEl = cpu.current
    const chipsEl = chips.current
    if (!boardEl || !cpuEl || !chipsEl) return

    const measure = () => {
      const b = boardEl.getBoundingClientRect()
      const c = cpuEl.getBoundingClientRect()
      const win = chipsEl.getBoundingClientRect()
      const all = Array.from(chipsEl.children).map((el, i) => {
        const r = el.getBoundingClientRect()
        return {
          idx: i,
          left: r.left - b.left,
          top: r.top - b.top,
          w: r.width,
          h: r.height,
          perSide: Math.max(4, Math.floor((pins[i] ?? 24) / 4)),
          shown: r.left >= win.left - 1 && r.right <= win.right + 1,
        }
      })
      // Chips scrolled out of the carousel window get no lines.
      const items = all.filter((i) => i.shown)
      if (!items.length) {
        setTraces([])
        return
      }

      // Left-to-right keeps the lines from tangling; columns share x, so rows break ties.
      items.sort((p, q) => p.left - q.left || p.top - q.top)

      const n = items.length
      const cL = c.left - b.left
      const cB = c.bottom - b.top
      const startY = cB - 4
      const firstTop = Math.min(...items.map((i) => i.top))
      const step = Math.min(LEVEL_GAP, MAX_BUS_DEPTH / n)
      const busTop = Math.max(startY + BEND + 4, firstTop - 12 - step * n)

      const out: Trace[] = []
      items.forEach((it, ci) => {
        const sx = cL + 30 + (n === 1 ? (c.width - 60) / 2 : ((c.width - 60) * ci) / (n - 1))
        const by = busTop + ci * step
        const head: Pt[] = [[sx, startY], [sx, by]]
        const gapX = it.left - 2 // centre of the free gap between neighbouring chips
        const delay = -((ci * 0.37) % 3.4)
        const duration = 2.8 + ((ci * 7) % 5) * 0.35
        const k = it.perSide

        for (let i = 0; i < k; i++) {
          const px = it.left + ((50 + (i * 100) / (k - 1)) / 200) * it.w
          // Later pins turn in higher up, so the lines nest instead of crossing.
          const laneY = it.top + 7 - (i * LANE_SPAN) / (k - 1)
          const laneX = gapX + (i - (k - 1) / 2) * LANE_GAP
          const tipY = it.top + it.h * PIN_TIP
          out.push({
            d: chamfer([...head, [laneX, by], [laneX, laneY], [px, laneY], [px, tipY]]),
            chip: it.idx,
            delay,
            duration,
          })
        }
      })

      // Fading traces that fan out of the top, left and right edges of the CPU.
      const cl = c.left - b.left
      const ct = c.top - b.top
      const cr = c.right - b.left
      const cb = c.bottom - b.top
      const along = (i: number, k: number, from: number, len: number) => from + 30 + ((len - 60) * i) / (k - 1)
      const lines: Trace[] = []
      const fan = (side: 'top' | 'left' | 'right', k: number) => {
        for (let i = 0; i < k; i++) {
          const o = (i - (k - 1) / 2) * 11 // sideways drift grows toward the corners
          const a = 14 + ((i * 5) % 4) * 9
          const bLen = 40 + ((i * 7) % 5) * 16
          const pts: Pt[] =
            side === 'top'
              ? ((x) => [[x, ct], [x, ct - a], [x + o, ct - a - Math.abs(o) - 6], [x + o, ct - a - Math.abs(o) - 6 - bLen]] as Pt[])(along(i, k, cl, c.width))
              : ((y) => {
                  const dir = side === 'left' ? -1 : 1
                  const x0 = side === 'left' ? cl : cr
                  return [[x0, y], [x0 + dir * a, y], [x0 + dir * (a + Math.abs(o) + 6), y + o], [x0 + dir * (a + Math.abs(o) + 6 + bLen), y + o]] as Pt[]
                })(along(i, k, ct, c.height))
          lines.push({ d: chamfer(pts), delay: -((i * 0.53 + k) % 3.1), duration: 3 + ((i * 3) % 4) * 0.4 })
        }
      }
      fan('top', 8)
      fan('left', 7)
      fan('right', 7)

      setSize({ w: b.width, h: b.height })
      setTraces(out)
      setDecor(lines)
      setFade({ x: (cl + cr) / 2, y: (ct + cb) / 2, r: c.width / 2 + 200 })
    }

    measure()
    let frame = 0
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), measure()))
    }
    chipsEl.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(boardEl)
    ro.observe(cpuEl)
    ro.observe(chipsEl)
    return () => {
      ro.disconnect()
      chipsEl.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [board, cpu, chips, pins])

  // The lines are invisible except inside a soft spotlight that follows the cursor.
  useEffect(() => {
    const boardEl = board.current
    const grad = spot.current
    if (!boardEl || !grad) return
    const hide = () => {
      grad.setAttribute('cx', '-9999')
      grad.setAttribute('cy', '-9999')
    }
    const move = (e: PointerEvent) => {
      const r = boardEl.getBoundingClientRect()
      grad.setAttribute('cx', String(e.clientX - r.left))
      grad.setAttribute('cy', String(e.clientY - r.top))
    }
    hide()
    boardEl.addEventListener('pointermove', move)
    boardEl.addEventListener('pointerleave', hide)
    return () => {
      boardEl.removeEventListener('pointermove', move)
      boardEl.removeEventListener('pointerleave', hide)
    }
  }, [board, traces.length])

  if (!traces.length) return null


  return (
    <svg className="traces" width={size.w} height={size.h} aria-hidden="true">
      <defs>
        <radialGradient id="traces-fade" gradientUnits="userSpaceOnUse" cx={fade.x} cy={fade.y} r={fade.r}>
          <stop offset="0.55" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="traces-fade-mask" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
          <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#traces-fade)" />
        </mask>
        <radialGradient ref={spot} id="traces-spot" gradientUnits="userSpaceOnUse" cx={-9999} cy={-9999} r={SPOT_RADIUS}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="traces-spot-mask" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
          <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#traces-spot)" />
        </mask>
      </defs>
      <g mask="url(#traces-spot-mask)">
      <g className="traces-glow" mask="url(#traces-fade-mask)">
        {decor.map((t, i) => (
          <path key={i} d={t.d} className="trace-base" />
        ))}
        {decor.map((t, i) => (
          <path
            key={`p${i}`}
            d={t.d}
            pathLength={100}
            className="trace-pulse"
            style={{ animationDelay: `${t.delay}s`, animationDuration: `${t.duration}s` }}
          />
        ))}
      </g>
      <g className="traces-glow">
        {traces.map((t, i) => (
          <path key={i} d={t.d} className="trace-base" />
        ))}
        {traces.map((t, i) => (
          <path
            key={`p${i}`}
            d={t.d}
            pathLength={100}
            className="trace-pulse"
            style={{ animationDelay: `${t.delay}s`, animationDuration: `${t.duration}s` }}
          />
        ))}
      </g>
      </g>
    </svg>
  )
}
