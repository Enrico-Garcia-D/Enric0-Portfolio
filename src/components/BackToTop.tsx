import { useScrolledPast } from '../hooks/useScrolledPast'

export default function BackToTop() {
  const visible = useScrolledPast(400)

  return (
    <button
      className={`back-to-top${visible ? ' visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      ↑
    </button>
  )
}
