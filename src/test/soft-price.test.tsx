import { StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SoftPrice } from '@/components/overview/soft-price'
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
  }
}
describe('soft live price crossfade', () => {
  it('crossfades only changed digits, keeps punctuation still and exposes one complete price', () => {
    const { container } = render(<SoftPrice quote={quote(72005, 72000)} active />)
    expect(container.querySelectorAll('[data-changing]')).toHaveLength(1)
    expect(container.querySelector('.price-glyph-old')).toHaveTextContent('0')
    expect(container.querySelector('[data-changing] .price-glyph-current')).toHaveTextContent('5')
    expect(container.querySelector('.sr-only')).toHaveTextContent('72.005,00')
    expect(container.querySelectorAll('.price-separator [data-changing]')).toHaveLength(0)
    expect(container.querySelector('.soft-price')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[aria-live]')).toBeNull()
  })
  it('preserves unchanged glyph nodes and replaces only the latest changing pair during bursts', () => {
    const { container, rerender } = render(<SoftPrice quote={quote(72001, 72000)} active />)
    const still = container.querySelector('.price-glyph')
    const separators = [...container.querySelectorAll('.price-separator')]
    const oldFade = container.querySelector('[data-changing]')
    rerender(<SoftPrice quote={quote(72002, 72001)} active />)
    expect(oldFade).not.toBeInTheDocument()
    expect(container.querySelector('.price-glyph')).toBe(still)
    expect([...container.querySelectorAll('.price-separator')]).toEqual(separators)
    expect(container.querySelector('.price-glyph-old')).toHaveTextContent('1')
    expect(container.querySelectorAll('[data-changing]')).toHaveLength(1)
    rerender(<SoftPrice quote={quote(72003, 72002)} active />)
    expect(container.querySelector('.price-glyph-old')).toHaveTextContent('2')
    expect(container.querySelectorAll('.price-glyph-old')).toHaveLength(1)
    expect(container.querySelector('.sr-only')).toHaveTextContent('72.003,00')
  })
  it('does not restart fades on unrelated renders or animate equal formatted values', () => {
    const { container, rerender } = render(<SoftPrice quote={quote(72005, 72000)} active />)
    const fade = container.querySelector('[data-changing]')
    rerender(<SoftPrice quote={{ ...quote(72005, 72000), change24h: -1 }} active />)
    expect(container.querySelector('[data-changing]')).toBe(fade)
    rerender(<SoftPrice quote={quote(72005.001, 72005)} active />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'none')
    expect(container.querySelector('[data-changing]')).toBeNull()
    expect(container.querySelector('.price-glyph-old')).toBeNull()
  })
  it('crossfades length changes as two actual numbers and cancels on inactive status or snapshot', () => {
    const { container, rerender } = render(<SoftPrice quote={quote(100000, 99999.99)} active />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'number')
    expect(container.querySelector('.price-previous')).toHaveTextContent('99.999,99')
    expect(container.querySelector('.sr-only')).toHaveTextContent('100.000,00')
    rerender(<SoftPrice quote={quote(100001, 100000)} active />)
    expect(container.querySelector('.price-previous')).toBeNull()
    expect(container.querySelectorAll('[data-changing]')).toHaveLength(1)
    rerender(<SoftPrice quote={quote(100001, 100000)} active={false} />)
    expect(container.querySelector('[data-changing]')).toBeNull()
    rerender(<SoftPrice quote={quote(90000, null)} active />)
    expect(container.querySelector('[data-animation]')).toHaveAttribute('data-animation', 'none')
    rerender(<SoftPrice quote={null} active={false} />)
    expect(container.querySelector('.sr-only')).toHaveTextContent('—')
  })
  it('does not allocate animation timers under StrictMode or leave work after unmount', () => {
    vi.useFakeTimers()
    try {
      const view = render(
        <StrictMode>
          <SoftPrice quote={quote(72001, 72000)} active />
        </StrictMode>,
      )
      expect(vi.getTimerCount()).toBe(0)
      view.unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
