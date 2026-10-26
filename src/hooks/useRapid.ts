import { useCallback, useRef } from 'react'

/** Returns a `hit()` function; calls onMatch when it is called `count` times within `windowMs`. */
export function useRapid(count: number, windowMs: number, onMatch: () => void) {
  const times = useRef<number[]>([])

  return useCallback(() => {
    const now = Date.now()
    times.current = [...times.current.filter((t) => now - t < windowMs), now]
    if (times.current.length >= count) {
      times.current = []
      onMatch()
    }
  }, [count, windowMs, onMatch])
}
