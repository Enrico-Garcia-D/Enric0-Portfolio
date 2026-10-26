import { PHOTO_URL, TOOLS } from '../data'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import CircuitTraces from './CircuitTraces'
import Chip, { CHIP_STYLES, FINISHES, PIN_COUNTS, type ChipLook } from './Chip'

const CHIP_W = 100 // keep in step with SIZE in Chip.tsx
const CHIP_GAP = 4

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]

/** Shuffles the six package styles and deals them out in rounds, so every style shows up evenly. */
function randomLooks(count: number): ChipLook[] {
  const deck: ChipLook['style'][] = []
  while (deck.length < count) {
    const round = [...CHIP_STYLES]
    for (let i = round.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[round[i], round[j]] = [round[j], round[i]]
    }
    deck.push(...round)
  }
  return deck.slice(0, count).map((style) => ({ style, finish: pick(FINISHES), pins: pick(PIN_COUNTS) }))
}

export default function About() {
  // New random assignment each visit; stable while the page stays open.
  const looks = useMemo(() => randomLooks(TOOLS.length), [])
  const pins = useMemo(() => looks.map((l) => l.pins), [looks])
  const boardRef = useRef<HTMLElement>(null)
  const cpuRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLUListElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const hovering = useRef(false)

  const sync = useCallback(() => {
    const el = chipsRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }, [])

  // One page is the visible width; the chips snap to the page start.
  const page = useCallback((dir: 1 | -1 | 'first') => {
    const el = chipsRef.current
    if (!el) return
    const left = dir === 'first' ? 0 : el.scrollLeft + dir * (el.clientWidth + 4)
    el.scrollTo({ left, behavior: 'smooth' })
  }, [])

  // The row is as wide as a whole number of chips fits between the arrows, so no chip is ever cut off.
  useLayoutEffect(() => {
    const box = carouselRef.current
    const el = chipsRef.current
    const arrow = box?.querySelector('button')
    if (!box || !el || !arrow) return
    const fit = () => {
      const avail = box.clientWidth - 2 * (arrow.offsetWidth + 8)
      const n = Math.max(1, Math.floor((avail + CHIP_GAP) / (CHIP_W + CHIP_GAP)))
      el.style.width = `${n * (CHIP_W + CHIP_GAP) - CHIP_GAP}px`
      sync()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [sync])

  useEffect(() => {
    const el = chipsRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)

    // Auto-advance, looping back to the start; paused only while a mouse is over it (focus and touch never stall it).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = reduce
      ? 0
      : window.setInterval(() => {
          if (hovering.current) return
          if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) page('first')
          else page(1)
        }, 3500)

    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      window.clearInterval(timer)
    }
  }, [sync, page])

  return (
    <section id="about" className="section fade-in about-board" ref={boardRef}>
      <CircuitTraces board={boardRef} cpu={cpuRef} chips={chipsRef} pins={pins} />
      <h2 className="section-title">About</h2>
      <div className="about-content-wrapper">
        <div>
          <p className="about-text">
            I consider myself a <span className="highlight">Digital Architect</span>.
          </p>
          <p className="about-text">
            My journey began with a dream of becoming an Architect, designing physical structures. However, I
            discovered that <b>Computer Science</b> offers the same creative freedom&mdash;building robust systems
            without the limits of gravity.
          </p>
          <p className="about-text">
            As a graduating <b>BSCS student</b>, my greatest strength is <span className="highlight">adaptability</span>.
            I don&apos;t just stick to one lane; I move between frontend and backend, and I&apos;m comfortable diving
            into both software and hardware.
          </p>
          <p className="about-text">
            My current stack is <b>React + TypeScript</b> on the client, <b>Express + TypeScript</b> on the server, and{' '}
            <b>MySQL</b> through <b>Prisma</b>. It&apos;s what I build with today, but I&apos;m{' '}
            <span className="highlight">open to switching stacks</span> when a project calls for something different.
          </p>
          <p className="about-text">
            I am currently open to <span className="highlight">full-time roles, freelance, and open source</span>{' '}
            collaborations where I can apply my skills and continue mastering future tech stacks.
          </p>
        </div>

        <div>
          <div className="cpu-glow" ref={cpuRef}>
            <div className="cpu">
              <span className="cpu-pin1" aria-hidden="true" />
              <div className="cpu-ihs">
                <img className="about-photo" src={PHOTO_URL} alt="Portrait of Enrico Garcia" width={320} height={320} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="about-tools">
        <h3 className="skill-title">Tech &amp; Tools</h3>
        <div
          className="chip-carousel"
          ref={carouselRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Tech and tools"
          onPointerEnter={(e) => (hovering.current = e.pointerType === 'mouse')}
          onPointerLeave={() => (hovering.current = false)}
        >
          <button type="button" className="carousel-arrow chip-arrow" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous tools">
            &larr;
          </button>
          <ul className="chip-grid" ref={chipsRef}>
            {TOOLS.map((t, i) => (
              <Chip key={t.label} icon={t} look={looks[i]} />
            ))}
          </ul>
          <button type="button" className="carousel-arrow chip-arrow" onClick={() => page(1)} disabled={edge.end} aria-label="Next tools">
            &rarr;
          </button>
        </div>
      </div>
    </section>
  )
}
