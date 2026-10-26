import { useEffect, useState } from 'react'

const INTERVAL_MS = 2600

export default function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Respect reduced-motion: keep the first word static.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [words.length])

  return (
    <>
      <span className="sr-only">{words.join(', ')}.</span>
      <span key={index} className="rotating-word" aria-hidden="true">
        {words[index]}.
      </span>
    </>
  )
}
