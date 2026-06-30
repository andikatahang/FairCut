import { Star } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StarRatingProps {
  /** Rating on a 1–5 scale. */
  value: number
  /** Optional review count, rendered as “(142)”. */
  count?: number
  /** Star size in pixels. */
  size?: number
  /** Render the numeric value next to the stars. */
  showValue?: boolean
  className?: string
}

/**
 * Read-only 1–5 star rating in the Manava brand palette (amber fill on a
 * light-gray track). Shared across the editor roster and — later — project
 * reviews, so star markup lives in one place.
 */
export function StarRating({ value, count, size = 14, showValue = true, className }: StarRatingProps) {
  const filled = Math.round(value)
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${value.toFixed(1)} dari 5 bintang`}
      >
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            strokeWidth={1.75}
            className={i <= filled ? 'text-amber-500 fill-amber-500' : 'text-[#dcdcdc]'}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-[13px] font-bold text-[#1b1b1b] tabular-nums">{value.toFixed(1)}</span>
      )}
      {count !== undefined && <span className="text-[12px] text-[#bbb]">({count})</span>}
    </div>
  )
}
