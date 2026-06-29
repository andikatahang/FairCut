import { Link } from 'react-router-dom'
import type { FC, SVGProps } from 'react'

export interface FeatureTile {
  label: string
  to: string
  icon: FC<SVGProps<SVGSVGElement>>
  /**
   * Optional tint applied to the circle background.
   * Defaults to navy/white on lime accent rotation handled by index.
   */
  accent?: 'lime' | 'blue' | 'emerald' | 'amber' | 'pink' | 'cyan' | 'navy'
  badge?: string
}

const ACCENT_BG: Record<NonNullable<FeatureTile['accent']>, string> = {
  lime: '#D0F100',
  blue: '#DCE9FF',
  emerald: '#DCFCE7',
  amber: '#FEF3C7',
  pink: '#FCE7F3',
  cyan: '#CFFAFE',
  navy: '#E5EBF0',
}

const ACCENT_ICON: Record<NonNullable<FeatureTile['accent']>, string> = {
  lime: '#021526',
  blue: '#0050F8',
  emerald: '#047857',
  amber: '#B45309',
  pink: '#BE185D',
  cyan: '#0E7490',
  navy: '#021526',
}

interface FeatureGridProps {
  title: string
  features: FeatureTile[]
}

export function FeatureGrid({ title, features }: FeatureGridProps) {
  return (
    <section
      aria-labelledby="feature-grid-heading"
      style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
    >
      <header className="flex items-end justify-between mb-4">
        <h2 id="feature-grid-heading" className="text-[15px] font-semibold tracking-[-0.01em] text-[#021526]">
          {title}
        </h2>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#596074]">
          {features.length} menu
        </p>
      </header>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-x-2 gap-y-5">
        {features.map(({ label, to, icon: Icon, accent = 'lime', badge }) => (
          <Link
            key={to + label}
            to={to}
            className="group flex flex-col items-center text-center"
          >
            <div className="relative">
              <span
                className="w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_30px_-8px_rgba(2,21,38,0.18)] border border-black/[0.04]"
                style={{ background: ACCENT_BG[accent] }}
              >
                <Icon
                  className="w-[22px] h-[22px]"
                  strokeWidth={1.85}
                  style={{ color: ACCENT_ICON[accent] }}
                />
              </span>
              {badge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0050F8] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#FBFBFB]">
                  {badge}
                </span>
              )}
            </div>
            <span className="text-[11.5px] sm:text-[12px] font-medium text-[#021526] mt-2 leading-tight tracking-[-0.01em] line-clamp-2">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
