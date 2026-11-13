import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Modal from './Modal'

const DURATION = 30
const WORD_COUNT = 90
const BEST_KEY = 'typingBest'

const WORDS = [
  'kernel', 'socket', 'buffer', 'cache', 'thread', 'stack', 'heap', 'pixel', 'cursor', 'packet',
  'router', 'switch', 'driver', 'daemon', 'binary', 'compile', 'deploy', 'commit', 'branch', 'merge',
  'render', 'render', 'query', 'schema', 'token', 'module', 'import', 'export', 'async', 'await',
  'array', 'object', 'string', 'number', 'boolean', 'function', 'class', 'interface', 'hook', 'state',
  'cpu', 'gpu', 'ram', 'ssd', 'bios', 'fan', 'heatsink', 'socket', 'chipset', 'voltage',
  'clock', 'bus', 'port', 'cable', 'power', 'board', 'solder', 'circuit', 'signal', 'latency',
  'build', 'debug', 'patch', 'fix', 'test', 'log', 'trace', 'error', 'crash', 'reboot',
]

const makeText = () =>
  Array.from({ length: WORD_COUNT }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ')

const readBest = () => {
  try {
    const n = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

type Phase = 'idle' | 'running' | 'done'

export default function TypingTest({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState(makeText)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [left, setLeft] = useState(DURATION)
  const [best, setBest] = useState(readBest)
  const [newBest, setNewBest] = useState(false)
  const startedAt = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)

  const focusInput = useCallback(() => {
    // Modal moves focus to itself after children mount, so defer.
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [])
  useEffect(focusInput, [focusInput])

  const stats = useMemo(() => {
    let correct = 0
    for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++
    const elapsed = phase === 'done' ? DURATION : Math.max(DURATION - left, 1)
    return {
      wpm: Math.round(correct / 5 / (elapsed / 60)),
      accuracy: typed.length ? Math.round((correct / typed.length) * 100) : 100,
      errors: typed.length - correct,
    }
  }, [typed, text, left, phase])

  const finish = useCallback(() => setPhase('done'), [])

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      const remaining = Math.max(0, DURATION - (performance.now() - startedAt.current) / 1000)
      setLeft(Math.ceil(remaining))
      if (remaining <= 0) finish()
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, finish])

  // Record the best score once, when a run finishes.
  const saved = useRef(false)
  useEffect(() => {
    if (phase !== 'done') {
      saved.current = false
      return
    }
    if (saved.current) return
    saved.current = true
    if (stats.wpm > best) {
      setBest(stats.wpm)
      setNewBest(true)
      try {
        localStorage.setItem(BEST_KEY, String(stats.wpm))
      } catch {
        /* storage unavailable */
      }
    }
  }, [phase, stats.wpm, best])

  useEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest' })
  }, [typed])

  const restart = useCallback(() => {
    setText(makeText())
    setTyped('')
    setPhase('idle')
    setLeft(DURATION)
    setNewBest(false)
    focusInput()
  }, [focusInput])

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (phase === 'done') return
    const value = e.target.value.slice(0, text.length)
    if (phase === 'idle' && value.length > 0) {
      startedAt.current = performance.now()
      setPhase('running')
    }
    setTyped(value)
    if (value.length >= text.length) finish()
  }

  return (
    <Modal
      title="Typing Test"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && phase === 'done' && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault()
          restart()
        }
      }}
    >
      <div className="modal-body typing">
        <div className="typing-stats" aria-live="off">
          <span>Time <b>{left}s</b></span>
          <span>WPM <b>{stats.wpm}</b></span>
          <span>Acc <b>{stats.accuracy}%</b></span>
          <span>Best <b>{best || '-'}</b></span>
        </div>

        <div className="typing-text" onClick={() => inputRef.current?.focus()} aria-hidden="true">
          {text.split('').map((ch, i) => {
            const state = i >= typed.length ? '' : typed[i] === ch ? ' ok' : ' bad'
            const isCaret = i === typed.length && phase !== 'done'
            return (
              <span key={i} ref={isCaret ? caretRef : undefined} className={`tt-ch${state}${isCaret ? ' caret' : ''}`}>
                {ch}
              </span>
            )
          })}
        </div>

        <input
          ref={inputRef}
          className="typing-input"
          value={typed}
          onChange={onChange}
          onPaste={(e) => e.preventDefault()}
          disabled={phase === 'done'}
          aria-label="Type the displayed text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={phase === 'idle' ? 'Start typing to begin...' : ''}
        />

        {phase === 'done' ? (
          <div className="typing-result" role="status">
            <p>
              Result: <b>{stats.wpm} WPM</b> · {stats.accuracy}% accuracy · {stats.errors} error{stats.errors === 1 ? '' : 's'}
            </p>
            {newBest && <p>New personal best.</p>}
            <button className="btn btn-solid" onClick={restart}>
              Try again
            </button>
          </div>
        ) : (
          <p className="typing-hint">{DURATION}-second test. The timer starts on your first keystroke. Esc to exit.</p>
        )}
      </div>
    </Modal>
  )
}
