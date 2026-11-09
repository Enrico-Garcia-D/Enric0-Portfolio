import { useLayoutEffect } from 'react'

const TARGETS = [
  '.section-title',
  '.about-text',
  '.about-portrait',
  '.skill-title',
  '.chip-marquee',
  '.carousel',
  '.panel',
  '.gh-panel',
  '.sysinfo',
  '.bootlog',
  '.contact-lead',
  '.social-links li',
  '.contact-form',
].join(',')

/** A bracket of glowing PCB trace, with solder pads at each end, laid over the element's box. */
function drawTrace(el: HTMLElement) {
  const parent = el.parentElement
  if (!parent) return
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'

  const trace = document.createElement('span')
  trace.className = 'build-trace'
  trace.setAttribute('aria-hidden', 'true')
  trace.style.cssText = `left:${el.offsetLeft}px;top:${el.offsetTop}px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;--build-i:${el.style.getPropertyValue('--build-i') || 0}`
  trace.innerHTML = '<i class="bt-h bt-top"></i><i class="bt-v"></i><i class="bt-h bt-bottom"></i><i class="bt-pad bt-pad-a"></i><i class="bt-pad bt-pad-b"></i>'
  parent.appendChild(trace)
  window.setTimeout(() => trace.remove(), 2200 + Number(el.style.getPropertyValue('--build-i') || 0) * 120)
}

/** Elements are "fabricated" as they scroll into view: trace routes in, then the part powers on. */
export function useScrollBuild() {
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const els = Array.from(document.querySelectorAll<HTMLElement>(TARGETS))
    const seen = new Map<Element, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          drawTrace(el)
          el.classList.add('built')
          io.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    for (const el of els) {
      const parent = el.parentElement!
      const n = seen.get(parent) ?? 0
      seen.set(parent, n + 1)
      el.style.setProperty('--build-i', String(Math.min(n, 8)))
      el.classList.add('build')
      io.observe(el)
    }

    return () => {
      io.disconnect()
      document.querySelectorAll('.build-trace').forEach((t) => t.remove())
      for (const el of els) el.classList.remove('build', 'built')
    }
  }, [])
}
