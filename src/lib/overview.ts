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

export function halvingAt(height: number) {
  if (!Number.isSafeInteger(height) || height < 0 || height > 2_147_483_647)
    throw new Error('Invalid block height')
  const cycle = Math.floor(height / 210_000)
  const completed = height % 210_000
  return {
    height,
    nextHeight: (cycle + 1) * 210_000,
    remaining: 210_000 - completed,
    progressPercent: (completed / 210_000) * 100,
    // Consensus subsidy uses integer satoshis, and stops after 64 halvings.
    subsidySats: cycle >= 64 ? 0 : Number(5_000_000_000n >> BigInt(cycle)),
  }
}
