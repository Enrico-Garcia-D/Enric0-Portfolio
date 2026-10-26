import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { PROJECTS, type Project } from '../data'
import ProjectCard from './ProjectCard'

const total = PROJECTS.length
const pad = (n: number) => String(n).padStart(2, '0')

export default function Work({ onReport }: { onReport: (project: Project) => void }) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Native scroll-snap handles swiping; this just tracks which slide is showing.
  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setActive(Math.round(el.scrollLeft / el.clientWidth)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  const goTo = useCallback((i: number) => {
    const el = track.current
    if (!el) return
    const next = Math.max(0, Math.min(total - 1, i))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(active - 1)
    }
  }

  return (
    <section id="work" className="section fade-in">
      <h2 className="section-title">Selected Work</h2>

      <div className="carousel" role="region" aria-roledescription="carousel" aria-label="Projects" onKeyDown={onKeyDown}>
        <div className="carousel-track" ref={track} tabIndex={0}>
          {PROJECTS.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} total={total} onReport={onReport} />
          ))}
        </div>

        {total > 1 && (
          <div className="carousel-bar">
            <span className="carousel-count" aria-live="polite">
              <b>{pad(active + 1)}</b> / {pad(total)}
            </span>

            <div className="carousel-dots">
              {PROJECTS.map((p, i) => (
                <button
                  key={p.title}
                  className={`carousel-dot${i === active ? ' on' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to ${p.title}`}
                  aria-current={i === active}
                />
              ))}
            </div>

            <div className="carousel-arrows">
              <button className="carousel-arrow" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous project">
                ←
              </button>
              <button
                className="carousel-arrow"
                onClick={() => goTo(active + 1)}
                disabled={active === total - 1}
                aria-label="Next project"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
