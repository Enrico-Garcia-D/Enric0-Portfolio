import { useEffect } from 'react'

interface Options {
  sectionIds: string[]
  onToggleTheme: () => void
  onSetup: () => void
  onTerminal: () => void
  enabled: boolean
}

/** BIOS-style shortcuts: 1-n jump, 0/Esc top, T theme, F2/Delete setup, ` terminal. */
export function useHotkeys({ sectionIds, onToggleTheme, onSetup, onTerminal, enabled }: Options) {
  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return

      if (e.key === 'F2' || e.key === 'Delete') {
        e.preventDefault()
        onSetup()
      } else if (e.key === '`') {
        e.preventDefault()
        onTerminal()
      } else if (e.key === '0' || e.key === 'Escape') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (e.key === 't' || e.key === 'T') {
        onToggleTheme()
      } else if (/^[1-9]$/.test(e.key)) {
        document.getElementById(sectionIds[Number(e.key) - 1] ?? '')?.scrollIntoView({ behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sectionIds, onToggleTheme, onSetup, onTerminal, enabled])
}
