import { CreditCard, TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { StatCard } from '../../components/ui/StatCard'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { mockEscrowAccounts, mockTransactions } from '../../data/mockData'

const typeLabels: Record<string, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  dp_payment:     { label: 'DP Payment', icon: ArrowUpRight, color: 'text-emerald-600' },
  final_payment:  { label: 'Final Payment', icon: ArrowUpRight, color: 'text-emerald-600' },
  major_topup:    { label: 'Top-up (Major)', icon: ArrowUpRight, color: 'text-blue-600' },
  escrow_hold:    { label: 'Escrow Hold', icon: RefreshCw, color: 'text-navy/60' },
  escrow_release: { label: 'Escrow Release', icon: TrendingUp, color: 'text-emerald-600' },
  refund:         { label: 'Refund', icon: ArrowDownLeft, color: 'text-red-600' },
  payroll:        { label: 'Payroll', icon: ArrowDownLeft, color: 'text-navy/60' },
}

export default function PaymentsPage() {
  const totalHeld = mockEscrowAccounts.reduce((s, e) => s + e.held_balance, 0)
  const totalReleased = mockEscrowAccounts.reduce((s, e) => s + e.released_balance, 0)
  const totalRefunded = mockEscrowAccounts.reduce((s, e) => s + e.refunded_balance, 0)

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Held in Escrow" value={formatCurrency(totalHeld)} icon={CreditCard} accent="bg-amber-50" change="Across 4 projects" />
        <StatCard label="Released to Company" value={formatCurrency(totalReleased)} icon={TrendingUp} accent="bg-emerald-50" change="+8M this month" changeType="up" />
        <StatCard label="Total Refunded" value={formatCurrency(totalRefunded)} icon={ArrowDownLeft} accent="bg-red-50" />
      </div>

      {/* Escrow accounts */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-4">Escrow Accounts by Project</h3>
        <div className="space-y-3">
          {mockEscrowAccounts.map(e => (
            <div key={e.escrow_id} className="flex items-center gap-4 p-4 bg-primary-200 rounded-xl">
              <div className="w-10 h-10 bg-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-navy/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy truncate">{e.project_title}</p>
                <p className="text-xs text-navy/50">{e.client_name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right flex-shrink-0">
                <div>
                  <p className="text-xs text-navy/40">Held</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(e.held_balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-navy/40">Released</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(e.released_balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-navy/40">Refunded</p>
                  <p className="text-sm font-semibold text-red-500">{formatCurrency(e.refunded_balance)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="card">
        <h3 className="font-semibold text-navy mb-4">Transaction Ledger</h3>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Type</th><th>Project</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {[...mockTransactions].reverse().map(t => {
                const meta = typeLabels[t.type] ?? { label: t.type, icon: RefreshCw, color: 'text-navy/60' }
                const Icon = meta.icon
                return (
                  <tr key={t.transaction_id}>
                    <td>
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />{meta.label}
                      </span>
                    </td>
                    <td className="text-navy/70 truncate max-w-[200px]">{t.project_title}</td>
                    <td className="font-semibold text-navy">{formatCurrency(t.amount)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-navy/50 text-xs">{formatDateTime(t.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
