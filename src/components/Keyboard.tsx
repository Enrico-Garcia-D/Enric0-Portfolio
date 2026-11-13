import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import Modal from './Modal'

interface Key {
  /** KeyboardEvent.code. Fn has no code, so it only reacts to clicks. */
  code: string
  label: string
  /** Width in key units (1u = standard alpha key). */
  w?: number
  /** Character typed when the key is clicked on screen. */
  ch?: string
}

const k = (code: string, label: string, w = 1, ch?: string): Key => ({ code, label, w, ch })
const letter = (c: string): Key => k(`Key${c}`, c, 1, c.toLowerCase())
const letters = (s: string) => s.split('').map(letter)

// 68-key layout: 65% with an extra Fn key. Every row is 16u wide.
const ROWS: Key[][] = [
  [
    k('Backquote', '`', 1, '`'),
    ...'1234567890'.split('').map((d) => k(`Digit${d}`, d, 1, d)),
    k('Minus', '-', 1, '-'),
    k('Equal', '=', 1, '='),
    k('Backspace', 'Bksp', 2),
    k('Delete', 'Del'),
  ],
  [
    k('Tab', 'Tab', 1.5),
    ...letters('QWERTYUIOP'),
    k('BracketLeft', '[', 1, '['),
    k('BracketRight', ']', 1, ']'),
    k('Backslash', '\\', 1.5, '\\'),
    k('PageUp', 'PgUp'),
  ],
  [
    k('CapsLock', 'Caps', 1.75),
    ...letters('ASDFGHJKL'),
    k('Semicolon', ';', 1, ';'),
    k('Quote', "'", 1, "'"),
    k('Enter', 'Enter', 2.25),
    k('PageDown', 'PgDn'),
  ],
  [
    k('ShiftLeft', 'Shift', 2.25),
    ...letters('ZXCVBNM'),
    k('Comma', ',', 1, ','),
    k('Period', '.', 1, '.'),
    k('Slash', '/', 1, '/'),
    k('ShiftRight', 'Shift', 1.75),
    k('ArrowUp', '↑'),
    k('End', 'End'),
  ],
  [
    k('ControlLeft', 'Ctrl', 1.25),
    k('MetaLeft', 'Win', 1.25),
    k('AltLeft', 'Alt', 1.25),
    k('Space', '', 6.25, ' '),
    k('AltRight', 'Alt'),
    k('Fn', 'Fn'),
    k('ControlRight', 'Ctrl'),
    k('ArrowLeft', '←'),
    k('ArrowDown', '↓'),
    k('ArrowRight', '→'),
  ],
]

const ROW_UNITS = 16
const KNOWN = new Set(ROWS.flat().map((key) => key.code))
const BUFFER_MAX = 48

let audio: AudioContext | undefined
const click = () => {
  try {
    audio ??= new AudioContext()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = 1400
    gain.gain.setValueAtTime(0.04, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.04)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + 0.04)
  } catch {
    /* audio unavailable */
  }
}

export default function Keyboard({ onClose }: { onClose: () => void }) {
  const [down, setDown] = useState<ReadonlySet<string>>(new Set())
  const [everPressed, setEverPressed] = useState<ReadonlySet<string>>(new Set())
  const [buffer, setBuffer] = useState('')
  const [presses, setPresses] = useState(0)
  const [sound, setSound] = useState(false)
  const soundRef = useRef(sound)
  soundRef.current = sound

  const press = useCallback((code: string) => {
    setDown((d) => new Set(d).add(code))
    setEverPressed((s) => (s.has(code) ? s : new Set(s).add(code)))
    setPresses((n) => n + 1)
    if (soundRef.current) click()
  }, [])

  const release = useCallback((code: string) => {
    setDown((d) => {
      if (!d.has(code)) return d
      const next = new Set(d)
      next.delete(code)
      return next
    })
  }, [])

  const edit = useCallback((ch: string | undefined, code: string) => {
    if (code === 'Backspace') setBuffer((b) => b.slice(0, -1))
    else if (code === 'Enter') setBuffer((b) => (b + '⏎').slice(-BUFFER_MAX))
    else if (ch) setBuffer((b) => (b + ch).slice(-BUFFER_MAX))
  }, [])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') return // Modal closes on Escape.
      if ((e.target as HTMLElement | null)?.closest('button') && (e.code === 'Enter' || e.code === 'Space')) return
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Let browser shortcuts through, but still light the key.
        if (KNOWN.has(e.code) && !e.repeat) press(e.code)
        return
      }
      e.preventDefault()
      if (e.repeat) {
        if (e.code === 'Backspace') edit(undefined, e.code)
        return
      }
      if (KNOWN.has(e.code)) press(e.code)
      edit(e.key.length === 1 ? e.key : undefined, e.code)
    }
    const onUp = (e: KeyboardEvent) => release(e.code)
    const onBlur = () => setDown(new Set())
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [press, release, edit])

  const onPointerDown = (key: Key) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault() // keep focus in the dialog
    e.currentTarget.setPointerCapture(e.pointerId)
    press(key.code)
    edit(key.ch, key.code)
  }
  const onPointerUp = (key: Key) => () => release(key.code)

  const reset = () => {
    setBuffer('')
    setPresses(0)
    setEverPressed(new Set())
  }

  return (
    <Modal title="Keyboard · 68 keys" onClose={onClose}>
      <div className="modal-body kb">
        <div className="kb-screen" aria-live="off">
          {buffer || <span className="kb-ph">Press keys on your keyboard or click the ones below...</span>}
          <span className="kb-cursor" aria-hidden="true" />
        </div>

        <div className="kb-board" role="group" aria-label="68-key keyboard">
          {ROWS.map((row, r) => (
            <div className="kb-row" key={r}>
              {row.map((key) => (
                <div className="kb-cell" key={key.code} style={{ width: `${((key.w ?? 1) / ROW_UNITS) * 100}%` }}>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`kb-key${down.has(key.code) ? ' down' : ''}${everPressed.has(key.code) ? ' seen' : ''}`}
                    aria-label={key.label || 'Space'}
                    aria-pressed={down.has(key.code)}
                    onPointerDown={onPointerDown(key)}
                    onPointerUp={onPointerUp(key)}
                    onPointerCancel={onPointerUp(key)}
                  >
                    {key.label}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="kb-foot">
          <span>
            Pressed <b>{presses}</b> · Tested <b>{everPressed.size}</b>/{KNOWN.size - 1}
          </span>
          <span className="kb-actions">
            <button type="button" className="kb-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => setSound((s) => !s)}>
              Sound: {sound ? 'on' : 'off'}
            </button>
            <button type="button" className="kb-btn" onMouseDown={(e) => e.preventDefault()} onClick={reset}>
              Reset
            </button>
          </span>
        </div>
        <p className="kb-hint">Keys light up as you press them, and stay marked once tested. Esc to exit.</p>
      </div>
    </Modal>
  )
}
