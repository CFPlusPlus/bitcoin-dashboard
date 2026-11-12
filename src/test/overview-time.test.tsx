import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { greetingAt, halvingAt, useGreeting } from '@/lib/overview'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
describe('browser-local greeting', () => {
  it.each([
    [0, 0, 'Gute Nacht'],
    [4, 59, 'Gute Nacht'],
    [5, 0, 'Guten Morgen'],
    [10, 59, 'Guten Morgen'],
    [11, 0, 'Guten Tag'],
    [17, 59, 'Guten Tag'],
    [18, 0, 'Guten Abend'],
    [22, 59, 'Guten Abend'],
    [23, 0, 'Gute Nacht'],
    [23, 59, 'Gute Nacht'],
  ])('local %s:%s gives %s', (hour, minute, expected) => {
    expect(greetingAt(new Date(2026, 10, 12, Number(hour), Number(minute)))).toBe(expected)
  })
  it('uses local hours rather than UTC or a fixed timezone', () => {
    const date = new Date('2026-11-12T03:00:00Z')
    vi.spyOn(date, 'getHours').mockReturnValue(18)
    expect(greetingAt(date)).toBe('Guten Abend')
  })
  it('updates at a boundary, after midnight, clock/timezone changes and returning from background; cleans its timer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 12, 10, 59, 55))
    const view = renderHook(useGreeting)
    expect(view.result.current).toBe('Guten Morgen')
    act(() => vi.advanceTimersByTime(4999))
    expect(view.result.current).toBe('Guten Morgen')
    act(() => vi.advanceTimersByTime(1))
    expect(view.result.current).toBe('Guten Tag')
    vi.setSystemTime(new Date(2026, 10, 12, 23, 59, 55))
    act(() => window.dispatchEvent(new Event('focus')))
    expect(view.result.current).toBe('Gute Nacht')
    act(() => vi.advanceTimersByTime(30_000))
    expect(view.result.current).toBe('Gute Nacht')
    vi.setSystemTime(new Date(2026, 10, 13, 5, 0))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(view.result.current).toBe('Guten Morgen')
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
describe('halving consensus arithmetic', () => {
  it.each([
    [0, 210000, 210000, 0, 5000000000],
    [105000, 210000, 105000, 50, 5000000000],
    [209999, 210000, 1, 209999 / 2100, 5000000000],
    [210000, 420000, 210000, 0, 2500000000],
    [210001, 420000, 209999, 1 / 2100, 2500000000],
    [839999, 840000, 1, 209999 / 2100, 625000000],
    [840000, 1050000, 210000, 0, 312500000],
    [1050000, 1260000, 210000, 0, 156250000],
    [33 * 210000, 34 * 210000, 210000, 0, 0],
    [64 * 210000, 65 * 210000, 210000, 0, 0],
  ])('height %s determines the running cycle', (height, next, remaining, progress, subsidy) => {
    const value = halvingAt(height)
    expect(value.nextHeight).toBe(next)
    expect(value.remaining).toBe(remaining)
    expect(value.progressPercent).toBeCloseTo(progress)
    expect(value.subsidySats).toBe(subsidy)
  })
  it.each([-1, 0.5, NaN, Infinity, 2 ** 31, Number.MAX_SAFE_INTEGER])(
    'rejects invalid height %s',
    (value) => expect(() => halvingAt(value)).toThrow(),
  )
})
