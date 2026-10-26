import { useEffect, useState } from 'react'

const LINES = [
  'ENRICO GARCIA PORTFOLIO BIOS v2.0',
  'Copyright (C) Enrico Garcia. All rights reserved.',
  '',
  'Main Processor ........ Adaptive',
  'Memory Test ........... OK',
  'Hardware .............. Detected',
  'Software .............. Detected',
  'UI / UX ............... Loaded',
  '',
  'Booting portfolio...',
]

/** One-time POST-style intro. Any key or click skips it. */
export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0)
  const [out, setOut] = useState(false)

  useEffect(() => {
    if (out) {
      const t = window.setTimeout(onDone, 400)
      return () => window.clearTimeout(t)
    }
    if (count >= LINES.length) {
      const t = window.setTimeout(() => setOut(true), 450)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setCount((c) => c + 1), 140)
    return () => window.clearTimeout(t)
  }, [count, out, onDone])

  useEffect(() => {
    const skip = () => setOut(true)
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [])

  return (
    <div className={`boot${out ? ' out' : ''}`} onClick={() => setOut(true)} aria-hidden="true">
      <pre>{LINES.slice(0, count).join('\n')}</pre>
      <span className="boot-cursor" />
      <p className="boot-hint">Press any key to skip</p>
    </div>
  )
}
