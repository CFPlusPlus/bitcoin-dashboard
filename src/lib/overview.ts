import { useEffect, useState } from 'react'

export function greetingAt(date: Date) {
  const hour = date.getHours()
  return hour >= 5 && hour < 11
    ? 'Guten Morgen'
    : hour >= 11 && hour < 18
      ? 'Guten Tag'
      : hour >= 18 && hour < 23
        ? 'Guten Abend'
        : 'Gute Nacht'
}

export function useGreeting() {
  // Stable server/initial render; local time is resolved after mounting.
  const [greeting, setGreeting] = useState('Willkommen')
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const update = () => {
      clearTimeout(timer)
      if (document.visibilityState === 'hidden') return
      const date = new Date()
      setGreeting(greetingAt(date))
      const boundary = new Date(date)
      boundary.setHours([5, 11, 18, 23].find((hour) => hour > date.getHours()) ?? 29, 0, 0, 0)
      // Exact local boundary; also re-read the clock/timezone at least every 30s.
      timer = setTimeout(update, Math.max(1, Math.min(30_000, boundary.getTime() - date.getTime())))
    }
    update()
    document.addEventListener('visibilitychange', update)
    window.addEventListener('focus', update)
    window.addEventListener('pageshow', update)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('pageshow', update)
    }
  }, [])
  return greeting
}

export { halvingAt } from '../../shared/bitcoin-supply'
