import { useEffect } from 'react'

const SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function useKonami(onMatch: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let i = 0

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === SEQUENCE[i]) {
        i += 1
        if (i === SEQUENCE.length) {
          i = 0
          onMatch()
        }
      } else {
        i = key === SEQUENCE[0] ? 1 : 0
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onMatch, enabled])
}
