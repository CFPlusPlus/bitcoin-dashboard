import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { RollingPrice } from '@/components/overview/rolling-price'
import type { LiveQuote } from '@/lib/kraken'

afterEach(cleanup)
function quote(price: number, previousPrice: number | null = price): LiveQuote {
  const delta = previousPrice == null ? 0 : price - previousPrice
  return {
    symbol: 'BTC/EUR',
    price,
    previousPrice,
    delta,
    direction: Math.sign(delta) as -1 | 0 | 1,
    timestamp: null,
    change24h: null,
    generation: 1,
    baseline: 1,
    receivedAt: 1000,
    flashUntil: 1300,
  }
}
describe('rolling live price glyphs', () => {
  it('moves only changed digits and keeps separators static, with one complete accessible price', () => {
    const { container } = render(<RollingPrice quote={quote(72005, 72000)} active />)
    expect(container.querySelectorAll('[data-rolling]')).toHaveLength(1)
    expect(container.querySelector('.price-digit-old')).toHaveTextContent('0')
    expect(container.querySelector('.sr-only')).toHaveTextContent('72.005,00')
    expect(container.querySelectorAll('.price-separator [data-rolling]')).toHaveLength(0)
    expect(container.querySelector('.rolling-price')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[aria-live]')).toBeNull()
  })
  it('leaves identical prices and new snapshots still, including re-renders', () => {
    const { container, rerender } = render(<RollingPrice quote={quote(72000)} active />)
    const glyph = container.querySelector('.price-digit-track')
    rerender(<RollingPrice quote={{ ...quote(72000), receivedAt: 2000 }} active />)
    expect(container.querySelector('.price-digit-track')).toBe(glyph)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'none')
    rerender(<RollingPrice quote={quote(90000, null)} active />)
    expect(container.querySelectorAll('[data-rolling]')).toHaveLength(0)
  })
  it('crossfades carries and large jumps without rendering intermediate digits', () => {
    const { container, rerender } = render(<RollingPrice quote={quote(100000, 99999.99)} active />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'fade')
    expect(container.querySelector('.sr-only')).toHaveTextContent('100.000,00')
    expect(container.querySelectorAll('.price-digit-old')).toHaveLength(0)
    rerender(<RollingPrice quote={quote(200000, 100000)} active />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'fade')
    rerender(<RollingPrice quote={quote(200000, 100000)} active={false} />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'none')
  })
})
