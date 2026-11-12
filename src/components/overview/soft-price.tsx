import { memo, type CSSProperties } from 'react'
import type { LiveQuote } from '@/lib/kraken'

const formatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const isDigit = (char: string) => /\d/.test(char)
const slots = (text: string) =>
  Math.max(
    11,
    [...text].reduce((width, char) => width + (isDigit(char) ? 1 : 0.5), 0),
  )

function NumberLayer({ text, previous }: { text: string; previous?: string }) {
  return (
    <span className="price-number-layer" style={{ '--price-slots': slots(text) } as CSSProperties}>
      {[...text].map((char, index) => {
        const changed = previous != null && isDigit(char) && char !== previous[index]
        return (
          <span
            className={isDigit(char) ? 'price-digit' : 'price-separator'}
            key={text.length - index}
          >
            {/* Only a changed glyph is replaced, cancelling its previous fade even during bursts. */}
            <span className="price-glyph" data-changing={changed || undefined} key={char}>
              {changed && <span className="price-glyph-old">{previous[index]}</span>}
              <span className="price-glyph-current">{char}</span>
            </span>
          </span>
        )
      })}
    </span>
  )
}

// CSS owns completion: at most two real glyphs per position, no animation timers or effects.
export const SoftPrice = memo(function SoftPrice({
  quote,
  active,
}: {
  quote: LiveQuote | null
  active: boolean
}) {
  const text = quote ? formatter.format(quote.price) : '—'
  const previous = quote?.previousPrice == null ? text : formatter.format(quote.previousPrice)
  const changed = active && previous !== text
  const samePositions = text.replace(/\d/g, '0') === previous.replace(/\d/g, '0')
  const animation = changed ? (samePositions ? 'digits' : 'number') : 'none'
  return (
    <span className="overview-price-number">
      <span className="sr-only">{text}</span>
      <span className="soft-price" aria-hidden="true" data-animation={animation}>
        <span className="price-current" key={animation === 'number' ? text : 'digits'}>
          <NumberLayer text={text} previous={animation === 'digits' ? previous : undefined} />
        </span>
        {animation === 'number' && (
          <span className="price-previous" key={`old-${text}`}>
            <NumberLayer text={previous} />
          </span>
        )}
      </span>
    </span>
  )
})
