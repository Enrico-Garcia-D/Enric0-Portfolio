import { PHOTO_URL, TOOLS } from '../data'
import { useMemo } from 'react'
import SystemInfo from './SystemInfo'
import Chip, { CHIP_STYLES, FINISHES, PIN_COUNTS, type ChipLook } from './Chip'

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

  return (
    <section id="about" className="section fade-in about-board">
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

        <div className="about-portrait">
          <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
            <filter id="pencil-sketch" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0" result="gray" />
              <feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edges" />
              <feComponentTransfer in="edges" result="lines">
                <feFuncR type="linear" slope="-3" intercept="1" />
                <feFuncG type="linear" slope="-3" intercept="1" />
                <feFuncB type="linear" slope="-3" intercept="1" />
              </feComponentTransfer>
              <feComponentTransfer in="gray" result="tone">
                <feFuncR type="linear" slope="0.35" intercept="0.65" />
                <feFuncG type="linear" slope="0.35" intercept="0.65" />
                <feFuncB type="linear" slope="0.35" intercept="0.65" />
              </feComponentTransfer>
              <feBlend in="lines" in2="tone" mode="multiply" />
            </filter>
          </svg>
          <div className="about-frame">
            <img className="about-photo" src={PHOTO_URL} alt="Portrait of Enrico Garcia" />
          </div>
        </div>
      </div>

      <SystemInfo />

      <div className="about-tools">
        <h3 className="skill-title">Tech &amp; Tools</h3>
        <div className="chip-marquee" role="group" aria-label="Tech and tools">
          <div className="chip-track">
            <ul className="chip-grid">
              {TOOLS.map((t, i) => (
                <Chip key={t.label} icon={t} look={looks[i]} />
              ))}
            </ul>
            {/* Duplicate set makes the loop seamless; hidden from assistive tech and the tab order */}
            <ul className="chip-grid" aria-hidden="true">
              {TOOLS.map((t, i) => (
                <Chip key={t.label} icon={t} look={looks[i]} decorative />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
