import { Link } from 'react-router-dom'
import type { FC, ReactNode, SVGProps } from 'react'
import { ChevronRight } from 'lucide-react'
import type { UserRole } from '../../types'

type IconType = FC<SVGProps<SVGSVGElement>>

interface BreadcrumbItem {
  label: string
  to?: string
}

interface PageHeaderAction {
  label: string
  to?: string
  onClick?: () => void
  icon?: IconType
  variant?: 'primary' | 'secondary'
}

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
  /** Role context — renders as a small chip on the right (desktop) for clarity. */
  role?: UserRole
  /** Optional CTA(s) rendered top-right on desktop. */
  actions?: PageHeaderAction[]
  /** Optional breadcrumb path (max 3 levels recommended). */
  breadcrumbs?: BreadcrumbItem[]
  /** Children render below the heading block (typically StatPills or filters). */
  children?: ReactNode
}

const roleChipLabel: Record<UserRole, string> = {
  superadmin: 'System Admin',
  hr_admin: 'HR Admin',
  admin_manager: 'Admin Manager',
  editor: 'Editor',
  client: 'Klien',
  mediator: 'Mediator',
  finance: 'Keuangan',
}

function ActionButton({ action }: { action: PageHeaderAction }) {
  const isPrimary = action.variant !== 'secondary'
  const base = isPrimary
    ? 'bg-[#D0F100] hover:brightness-95 text-[#021526]'
    : 'bg-white border border-[#021526]/15 hover:border-[#021526]/30 text-[#021526]'
  const cls = `group inline-flex items-center gap-1.5 ${base} font-semibold px-4 py-2 rounded-full text-[13px] tracking-[-0.01em] transition-all duration-150`
  const Icon = action.icon

  const inner = (
    <>
      {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2} />}
      {action.label}
    </>
  )

  if (action.to) {
    return <Link to={action.to} className={cls}>{inner}</Link>
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {inner}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  role,
  actions,
  breadcrumbs,
  children,
}: PageHeaderProps) {
  return (
    <header
      className="mb-6 sm:mb-8"
      style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-1 text-[12px] text-[#596074]">
            {breadcrumbs.map((b, i) => (
              <li key={`${b.label}-${i}`} className="flex items-center gap-1">
                {b.to ? (
                  <Link to={b.to} className="hover:text-[#021526] transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-[#021526] font-medium">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-[#596074]/40" />}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0 max-w-[680px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#596074]">
            {eyebrow}
          </p>
          <h1 className="text-[clamp(1.5rem,3.4vw,2rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[#021526] mt-1.5">
            {title}
          </h1>
          {description && (
            <p className="text-[13.5px] sm:text-[14px] text-[#596074] mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {role && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#021526]/70 bg-[#021526]/[0.04] border border-[#021526]/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {roleChipLabel[role]}
            </span>
          )}
          {actions?.map(a => <ActionButton key={a.label} action={a} />)}
        </div>
      </div>

      {children && <div className="mt-5 sm:mt-6">{children}</div>}
    </header>
  )
}

interface StatPillProps {
  label: string
  value: string | number
  tone?: 'navy' | 'blue' | 'emerald' | 'amber' | 'red' | 'lime'
  hint?: string
}

const STAT_TONE: Record<NonNullable<StatPillProps['tone']>, string> = {
  navy: 'text-[#021526]',
  blue: 'text-[#0050F8]',
  emerald: 'text-[#047857]',
  amber: 'text-[#B45309]',
  red: 'text-[#B91C1C]',
  lime: 'text-[#021526]',
}

export function StatPill({ label, value, tone = 'navy', hint }: StatPillProps) {
  return (
    <div
      className="rounded-[8px] bg-[#fbfbfb] border border-black/[0.05] px-4 py-3.5"
      style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#596074]">
        {label}
      </p>
      <p className={`text-[clamp(1.35rem,2.5vw,1.6rem)] font-bold tracking-[-0.03em] tabular-nums leading-none mt-2 ${STAT_TONE[tone]}`}>
        {value}
      </p>
      {hint && <p className="text-[11.5px] text-[#596074] mt-1.5">{hint}</p>}
    </div>
  )
}

interface StatPillsRowProps {
  items: StatPillProps[]
  cols?: 2 | 3 | 4
}

export function StatPillsRow({ items, cols = 4 }: StatPillsRowProps) {
  const grid = cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
  return (
    <div className={`grid grid-cols-2 ${grid} gap-3`}>
      {items.map(it => <StatPill key={it.label} {...it} />)}
    </div>
  )
}
