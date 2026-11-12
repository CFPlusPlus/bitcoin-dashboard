import { memo, type CSSProperties } from 'react'
import type { LiveQuote } from '@/lib/kraken'

const formatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Only the old and new glyph move: no interpolated prices or intermediate digits.
export const RollingPrice = memo(function RollingPrice({
  quote,
  active,
}: {
  quote: LiveQuote | null
  active: boolean
}) {
  const text = quote ? formatter.format(quote.price) : '—'
  const previous = quote?.previousPrice == null ? text : formatter.format(quote.previousPrice)
  const rolling =
    active &&
    !!quote?.direction &&
    previous.length === text.length &&
    Math.abs(quote.delta) / quote.price < 0.05
  const fade = active && !!quote?.direction && !rolling
  const slots = Math.max(
    11,
    [...text].reduce((width, char) => width + (/\d/.test(char) ? 1 : 0.5), 0),
  )
  return (
    <span className="overview-price-number" style={{ '--price-slots': slots } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span
        className="rolling-price"
        aria-hidden="true"
        data-animation={rolling ? 'roll' : fade ? 'fade' : 'none'}
      >
        {[...text].map((char, index) => {
          const changed = rolling && /\d/.test(char) && char !== previous[index]
          return (
            <span
              className={/\d/.test(char) ? 'price-digit' : 'price-separator'}
              key={text.length - index}
            >
              <span
                className="price-digit-track"
                data-rolling={changed || undefined}
                key={changed || fade ? quote?.flashUntil : 'still'}
              >
                {changed && <span className="price-digit-old">{previous[index]}</span>}
                <span>{char}</span>
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
})
