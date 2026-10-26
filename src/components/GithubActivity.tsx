import { useEffect, useRef, type CSSProperties } from 'react'
import { GITHUB_USER } from '../data'
import { useGithub, type Day } from '../hooks/useGithub'

const PROFILE = `https://github.com/${GITHUB_USER}`

interface Placed extends Day {
  col: number
  row: number
}

/** Places each day on a week (column) / weekday (row) grid, Sunday first, like GitHub. */
function layout(days: Day[]) {
  let col = 0
  const placed: Placed[] = days.map((d, i) => {
    const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay()
    if (i > 0 && dow === 0) col += 1
    return { ...d, col, row: dow }
  })

  const months: { col: number; label: string }[] = []
  let lastMonth = -1
  let lastCol = -10
  for (const p of placed) {
    if (p.row !== 0 && p.col !== 0) continue
    const date = new Date(`${p.date}T00:00:00Z`)
    if (date.getUTCMonth() !== lastMonth && p.col - lastCol >= 3) {
      months.push({ col: p.col, label: date.toLocaleDateString('en', { month: 'short', timeZone: 'UTC' }) })
      lastCol = p.col
    }
    lastMonth = date.getUTCMonth()
  }
  return { placed, months, weeks: placed[placed.length - 1].col + 1 }
}

type Layout = ReturnType<typeof layout>

function stats(days: Day[]) {
  let longest = 0
  let run = 0
  let active = 0
  for (const d of days) {
    if (d.count > 0) {
      active += 1
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 0
    }
  }
  return { active, longest }
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en', { month: 'short', year: 'numeric' })

/** Weeks [from, to) of the year as a GitHub-style grid. */
function HeatGrid({ grid, from, to, label }: { grid: Layout; from: number; to: number; label: string }) {
  const cells = grid.placed.filter((d) => d.col >= from && d.col < to)
  const months = grid.months.filter((m) => m.col >= from && m.col <= to - 3)

  return (
    <div className="heat" style={{ '--weeks': to - from } as CSSProperties} role="img" aria-label={label}>
      {months.map((m) => (
        <span key={m.col} className="heat-month" style={{ gridColumn: `${m.col - from + 1} / span 3` }}>
          {m.label}
        </span>
      ))}
      {cells.map((d) => (
        <span
          key={d.date}
          className={`cell l${d.level}`}
          style={{ gridColumn: d.col - from + 1, gridRow: d.row + 2, '--c': d.col - from } as CSSProperties}
          title={`${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`}
        />
      ))}
    </div>
  )
}

// Traced from an RTX 5090 Founders Edition photo; coordinates are in that photo's pixel space, cropped to 1500x710.
// Each panel is the black well's outline pulled in by 30px, then stroked round so the corners come out rounded.
const PANEL_L = '315,230 691.6,230 894.8,457 691.6,685 315,685'
const PANEL_R = '1605,230 1228.4,230 1025.2,457 1228.4,685 1605,685'

/** Graphite body, bronze-framed ribbed panels meeting in an X, I/O bracket and the PCIe edge connector. */
function CardArt() {
  return (
    <svg className="gpu-art" viewBox="200 40 1500 710" aria-hidden="true">
      <defs>
        <linearGradient id="gpu-bronze" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b9aca0" />
          <stop offset="0.35" stopColor="#857a70" />
          <stop offset="0.6" stopColor="#a89b8d" />
          <stop offset="1" stopColor="#6a6159" />
        </linearGradient>
        <linearGradient id="gpu-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#58585b" />
          <stop offset="0.45" stopColor="#434345" />
          <stop offset="1" stopColor="#323234" />
        </linearGradient>
        <linearGradient id="gpu-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#505053" />
          <stop offset="1" stopColor="#3a3a3c" />
        </linearGradient>
        <linearGradient id="gpu-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="gpu-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b3d40" />
          <stop offset="0.5" stopColor="#8a8d91" />
          <stop offset="1" stopColor="#4a4c50" />
        </linearGradient>
        <pattern id="gpu-ribs" width="4" height="10" patternUnits="userSpaceOnUse">
          <rect width="4" height="10" fill="#060607" />
          <rect width="1.4" height="10" fill="#26272b" />
        </pattern>
        <pattern id="gpu-fingers" width="5" height="24" patternUnits="userSpaceOnUse">
          <rect width="3.3" height="24" fill="#d9bd68" />
        </pattern>
      </defs>

      {/* I/O bracket: thin plate behind the left edge with a top hook and a foot tab */}
      <rect x="254" y="48" width="13" height="690" fill="url(#gpu-steel)" />
      <path d="M254 48 H276 V62 H268 V90 H254 Z" fill="#6d7074" />
      <rect x="205" y="590" width="60" height="10" rx="1.5" fill="#55585c" />
      <rect x="205" y="590" width="10" height="3" fill="#8a8d91" />

      {/* PCIe edge connector: PCB tab with two runs of gold contacts, the key gap, and the stepped end */}
      <path d="M472 118 H856 V130 H925 V160 H472 Z" fill="#74777b" />
      <path d="M472 118 H856 V121 H472 Z" fill="#a4a7ab" />
      <rect x="475" y="121" width="47" height="23" fill="url(#gpu-fingers)" />
      <rect x="534" y="121" width="322" height="23" fill="url(#gpu-fingers)" />

      {/* Graphite body */}
      <rect x="262" y="175" width="1395" height="560" rx="78" fill="url(#gpu-body)" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M340 177 H1580" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
      {/* Slot cut-out in the top plate, beside the connector */}
      <rect x="912" y="176" width="78" height="13" rx="4" fill="#1b1b1d" />

      {/* Center plates: the gray quarters above and below the X */}
      <polygon points="700,178 1220,178 1000,425 920,425" fill="url(#gpu-plate)" opacity="0.55" />
      <polygon points="920,489 1000,489 1230,735 690,735" fill="#3d3d3f" opacity="0.5" />

      {/* Panels: bronze frame, black well, fine vertical ribs, soft sheen */}
      {[PANEL_L, PANEL_R].map((pts) => (
        <g key={pts}>
          <polygon points={pts} fill="url(#gpu-bronze)" stroke="url(#gpu-bronze)" strokeWidth="92" strokeLinejoin="round" />
          <polygon points={pts} fill="#050506" stroke="#050506" strokeWidth="60" strokeLinejoin="round" />
          <polygon points={pts} fill="url(#gpu-ribs)" stroke="url(#gpu-ribs)" strokeWidth="60" strokeLinejoin="round" />
          <polygon points={pts} fill="url(#gpu-sheen)" stroke="url(#gpu-sheen)" strokeWidth="60" strokeLinejoin="round" />
        </g>
      ))}

      {/* Junction where the two frames meet at the center of the X */}
      <polygon points="918,457 960,424 1002,457 960,490" fill="url(#gpu-bronze)" stroke="#000" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Engraved lettering along the lower-left arm */}
      <g transform="translate(806 694) rotate(-49)" fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="30" fontWeight="700" letterSpacing="4">
        <text y="1.5" fill="#fff" opacity="0.2">GITFORCE</text>
        <text y="0" fill="#9a8d7e">GITFORCE</text>
      </g>
    </svg>
  )
}

/**
 * Scroll transition into the contributions. --p (0..1) tracks how far the card has come up the viewport and
 * drives its tilt and rise; `.on` powers the contribution cells on, column by column, once it is mostly in view.
 */
function useGpuScroll() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.75)))
      el.style.setProperty('--p', p.toFixed(3))
      if (p > 0.7) el.classList.add('on')
      else if (p < 0.3) el.classList.remove('on')
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

export default function GithubActivity() {
  const gh = useGithub()
  const gpuRef = useGpuScroll()
  const days = gh.days
  const grid = days?.length ? layout(days) : null
  const s = days ? stats(days) : null
  const mid = grid ? Math.ceil(grid.weeks / 2) : 0

  return (
    <section id="code" className="section fade-in">
      <h2 className="section-title">Code</h2>
      <p className="section-lead">Live from GitHub: my contribution activity and recent repositories.</p>

      {gh.status === 'loading' && <p className="gh-note">Loading GitHub activity...</p>}

      {gh.status === 'error' && (
        <p className="gh-note">
          Couldn&apos;t load live GitHub data right now.{' '}
          <a href={PROFILE} target="_blank" rel="noopener noreferrer">
            View my profile on GitHub →
          </a>
        </p>
      )}

      {grid && s && (
        <>
          <div className="gpu" ref={gpuRef}>
            <div className="gpu-card">
              <CardArt />
              <div className="gpu-grid left">
                <HeatGrid grid={grid} from={0} to={mid} label="Contributions, first half of the last year" />
              </div>
              <div className="gpu-grid right">
                <HeatGrid grid={grid} from={mid} to={grid.weeks} label="Contributions, second half of the last year" />
              </div>
            </div>

            <div className="gpu-mobile">
              <div className="gpu-mobile-in">
                <HeatGrid grid={grid} from={0} to={grid.weeks} label={`${gh.total} contributions in the last year`} />
              </div>
            </div>
          </div>

          <div className="gpu-plate">
            <div className="heat-stats">
              <span>
                <b>{gh.total}</b> contributions in the last year
              </span>
              <span>
                <b>{s.active}</b> active days
              </span>
              <span>
                <b>{s.longest}</b>-day longest streak
              </span>
            </div>
            <div className="heat-legend" aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((l) => (
                <span key={l} className={`cell l${l}`} />
              ))}
              More
            </div>
          </div>
        </>
      )}

      {gh.repos && gh.repos.length > 0 && (
        <div className="repo-list">
          {gh.repos.map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="repo">
              <span className="repo-name">{r.name}</span>
              {r.description && <span className="repo-desc">{r.description}</span>}
              <span className="repo-meta">
                {r.language && <span>{r.language}</span>}
                {r.stars > 0 && <span>★ {r.stars}</span>}
                <span>updated {fmt(r.pushed)}</span>
              </span>
            </a>
          ))}
        </div>
      )}

      {gh.status === 'ok' && (
        <a className="link-btn gh-profile" href={PROFILE} target="_blank" rel="noopener noreferrer">
          View all on GitHub →
        </a>
      )}
    </section>
  )
}
