import { useEffect, useState } from 'react'

interface Props {
  stopCode: string
  onRestart: () => void
}

/** Fake blue screen. Counts to 100%, then restarts; any key or click restarts early. */
export default function Bsod({ stopCode, onRestart }: Props) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (pct >= 100) {
      const t = window.setTimeout(onRestart, 600)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setPct((p) => Math.min(100, p + 2)), 80)
    return () => window.clearTimeout(t)
  }, [pct, onRestart])

  useEffect(() => {
    window.addEventListener('keydown', onRestart)
    return () => window.removeEventListener('keydown', onRestart)
  }, [onRestart])

  return (
    <div className="bsod" onClick={onRestart} role="alert">
      <div className="bsod-inner">
        <p className="bsod-face">:(</p>
        <p className="bsod-msg">
          Your portfolio ran into a problem and needs to restart. We&apos;re just collecting some error info, and then
          we&apos;ll restart for you.
        </p>
        <p className="bsod-pct">{pct}% complete</p>
        <p className="bsod-small">
          Stop code: {stopCode}
          <br />
          (Just kidding. Everything is fine. Press any key to restart now.)
        </p>
      </div>
    </div>
  )
}
