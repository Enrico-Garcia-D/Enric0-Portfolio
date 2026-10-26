import { useEffect, useState } from 'react'
import Modal from './Modal'

const BAR = 20

export default function Memtest({ onClose }: { onClose: () => void }) {
  const [pct, setPct] = useState(0)
  const done = pct >= 100

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(onClose, 2200)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setPct((p) => Math.min(100, p + 4)), 70)
    return () => window.clearTimeout(t)
  }, [pct, done, onClose])

  const filled = Math.round((pct / 100) * BAR)

  return (
    <Modal title="Memtest" onClose={onClose}>
      <div className="modal-body" aria-live="polite">
        <pre className="memtest">
          {`Memtest (portfolio edition)\n\nTesting memory  [${'█'.repeat(filled)}${'░'.repeat(BAR - filled)}] ${pct}%\nPass 1 of 1 · Errors: 0\n\n${
            done ? 'Result: PASS. Hardware and software both check out.' : 'Running...'
          }`}
        </pre>
      </div>
    </Modal>
  )
}
