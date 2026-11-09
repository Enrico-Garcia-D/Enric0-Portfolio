import { useEffect, useState, type CSSProperties } from 'react'
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

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

/** GitHub's contribution graph: weekday labels, month labels, weeks across and days down. */
function ContributionGraph({ grid, total }: { grid: Layout; total: number }) {
  return (
    <div className="gh-scroll">
      <div className="gh-heat" style={{ '--weeks': grid.weeks } as CSSProperties} role="img" aria-label={`${total} contributions`}>
        {grid.months.map((m) => (
          <span key={m.col} className="gh-month" style={{ gridColumn: m.col + 2 }}>
            {m.label}
          </span>
        ))}
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="gh-day" style={{ gridRow: i + 2 }}>
            {d}
          </span>
        ))}
        {grid.placed.map((d) => (
          <span
            key={d.date}
            className={`gh-cell l${d.level}`}
            style={{ gridColumn: d.col + 2, gridRow: d.row + 2 }}
            title={`${d.count} contribution${d.count === 1 ? '' : 's'} on ${new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`}
          />
        ))}
      </div>
    </div>
  )
}

interface AllYears {
  years: number[]
  days: Day[]
  totals: Record<string, number>
}

/** Every year of contribution history, for the year picker. Silent on failure: the picker just doesn't show. */
function useAllYears(): AllYears | null {
  const [all, setAll] = useState<AllYears | null>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=all`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ total: Record<string, number>; contributions: Day[] }>) : Promise.reject()))
      .then((j) => {
        const years = Object.keys(j.total)
          .map(Number)
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => b - a)
        setAll({ years, days: j.contributions, totals: j.total })
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])
  return all
}

export default function GithubActivity() {
  const gh = useGithub()
  const all = useAllYears()
  const [year, setYear] = useState<number | null>(null) // null = the rolling last year, GitHub's default view
  const [menu, setMenu] = useState(false)

  const thisYear = new Date().getFullYear()
  const picked = year !== null && all ? all.days.filter((d) => d.date.startsWith(String(year))) : null
  const days = picked?.length ? picked : gh.days
  const total = picked?.length ? (all?.totals[String(year)] ?? 0) : (gh.total ?? 0)
  const grid = days?.length ? layout(days) : null
  const s = days ? stats(days) : null
  const title = picked?.length ? `${total} contributions in ${year}` : `${total} contributions in the last year`

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
        <div className="gh-panel">
          <div className="gh-main">
            <div className="gh-top">
              <h3 className="gh-title">{title}</h3>
              <div className="gh-settings">
                <button type="button" className="gh-settings-btn" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  Contribution settings <span aria-hidden="true">▾</span>
                </button>
                {menu && (
                  <div className="gh-menu" onClick={() => setMenu(false)}>
                    <a href={PROFILE} target="_blank" rel="noopener noreferrer">
                      View profile on GitHub
                    </a>
                    <a href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile" target="_blank" rel="noopener noreferrer">
                      Learn how we count contributions
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="gh-box">
              <ContributionGraph grid={grid} total={total} />
              <div className="gh-foot">
                <a href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile" target="_blank" rel="noopener noreferrer">
                  Learn how we count contributions
                </a>
                <div className="gh-legend" aria-hidden="true">
                  Less
                  {[0, 1, 2, 3, 4].map((l) => (
                    <span key={l} className={`gh-cell l${l}`} />
                  ))}
                  More
                </div>
              </div>
            </div>
            <p className="gh-streak">
              {s.active} active days &middot; {s.longest}-day longest streak
            </p>
          </div>

          {all && all.years.length > 0 && (
            <ul className="gh-years" aria-label="Contribution year">
              {[thisYear, ...all.years.filter((y) => y !== thisYear)].map((y) => {
                const on = year === null ? y === thisYear : y === year
                return (
                  <li key={y}>
                    <button type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => setYear(y === thisYear ? null : y)}>
                      {y}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
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
