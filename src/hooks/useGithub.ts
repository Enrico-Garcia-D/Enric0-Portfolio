import { useEffect, useState } from 'react'
import { GITHUB_USER, HIDDEN_REPOS } from '../data'

export interface Day {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface Repo {
  name: string
  description: string | null
  language: string | null
  stars: number
  url: string
  pushed: string
}

export interface GithubState {
  status: 'loading' | 'ok' | 'error'
  days?: Day[]
  total?: number
  repos?: Repo[]
}

const CACHE_KEY = `gh:${GITHUB_USER}`
const CACHE_MS = 30 * 60 * 1000 // unauthenticated GitHub API allows ~60 requests/hour per IP
const MAX_REPOS = 6

interface RawRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  pushed_at: string
  fork: boolean
}

const readCache = (): GithubState | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { t, state } = JSON.parse(raw) as { t: number; state: GithubState }
    return Date.now() - t < CACHE_MS ? state : null
  } catch {
    return null
  }
}

const writeCache = (state: GithubState) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), state }))
  } catch {
    /* storage unavailable */
  }
}

/** Loads contribution activity and recent repos. Either half may fail independently. */
export function useGithub(): GithubState {
  const [state, setState] = useState<GithubState>(() => readCache() ?? { status: 'loading' })

  useEffect(() => {
    if (state.status === 'ok') return
    const ctrl = new AbortController()

    const contributions = fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`, {
      signal: ctrl.signal,
    }).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json() as Promise<{ total: { lastYear: number }; contributions: Day[] }>
    })

    const repos = fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, {
      signal: ctrl.signal,
    }).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json() as Promise<RawRepo[]>
    })

    Promise.allSettled([contributions, repos]).then(([c, r]) => {
      if (ctrl.signal.aborted) return
      if (c.status === 'rejected' && r.status === 'rejected') return setState({ status: 'error' })

      const next: GithubState = {
        status: 'ok',
        days: c.status === 'fulfilled' ? c.value.contributions : undefined,
        total: c.status === 'fulfilled' ? c.value.total.lastYear : undefined,
        repos:
          r.status === 'fulfilled'
            ? r.value
                .filter((x) => !x.fork && !HIDDEN_REPOS.includes(x.name) && (x.description || x.language))
                .slice(0, MAX_REPOS)
                .map((x) => ({
                  name: x.name,
                  description: x.description,
                  language: x.language,
                  stars: x.stargazers_count,
                  url: x.html_url,
                  pushed: x.pushed_at,
                }))
            : undefined,
      }
      writeCache(next)
      setState(next)
    })

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
