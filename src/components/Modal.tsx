import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** Runs before the built-in Escape/Tab handling. */
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
}

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** BIOS-styled dialog: focus moves in, Tab is trapped, Esc closes, focus is restored on close. */
export default function Modal({ title, onClose, children, onKeyDown }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [])

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return

    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      if (items.length === 0) return e.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={handleKey}>
        <div className="modal-title">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
