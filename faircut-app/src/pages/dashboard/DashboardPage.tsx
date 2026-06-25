import { Briefcase, Users, AlertTriangle, CreditCard, TrendingUp, Clock } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockProjects, mockEditors, mockDisputes, mockTransactions } from '../../data/mockData'
import type { UserRole } from '../../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 24000000 }, { month: 'Feb', revenue: 18000000 },
  { month: 'Mar', revenue: 32000000 }, { month: 'Apr', revenue: 28000000 },
  { month: 'May', revenue: 41000000 }, { month: 'Jun', revenue: 38000000 },
]
const projectData = [
  { month: 'Jan', completed: 5, cancelled: 1 }, { month: 'Feb', completed: 4, cancelled: 0 },
  { month: 'Mar', completed: 8, cancelled: 1 }, { month: 'Apr', completed: 7, cancelled: 2 },
  { month: 'May', completed: 10, cancelled: 1 }, { month: 'Jun', completed: 9, cancelled: 0 },
]

export default function DashboardPage({ role }: { role: UserRole }) {
  const activeProjects = mockProjects.filter(p => ['in_progress','in_review','revision'].includes(p.status)).length
  const openDisputes = mockDisputes.filter(d => d.status === 'open' || d.status === 'in_mediation').length
  const totalRevenue = mockTransactions.filter(t => t.type === 'escrow_release' && t.status === 'success').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={activeProjects} icon={Briefcase} change="+2 this week" changeType="up" accent="bg-blue-50" />
        <StatCard label="Active Editors" value={mockEditors.filter(e => e.status === 'active').length} icon={Users} change="1 onboarding" changeType="neutral" accent="bg-emerald-50" />
        <StatCard label="Open Disputes" value={openDisputes} icon={AlertTriangle} change="2 need attention" changeType={openDisputes > 0 ? 'down' : 'neutral'} accent="bg-amber-50" />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={CreditCard} change="+12% vs last month" changeType="up" accent="bg-navy-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Revenue Overview</h3>
              <p className="text-xs text-navy/50 mt-0.5">Monthly escrow releases</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" /> +18.4% YTD
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#022E5799' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} contentStyle={{ borderRadius: '10px', border: '1px solid #E8EDF2', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#022E57" strokeWidth={2.5} dot={{ fill: '#022E57', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by status */}
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Projects by Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectData} barSize={10}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#022E5799' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E8EDF2', fontSize: '12px' }} />
              <Bar dataKey="completed" fill="#022E57" radius={[4,4,0,0]} />
              <Bar dataKey="cancelled" fill="#E8EDF2" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-navy/60"><span className="w-3 h-3 bg-navy rounded-sm inline-block" /> Completed</div>
            <div className="flex items-center gap-1.5 text-xs text-navy/60"><span className="w-3 h-3 bg-border rounded-sm inline-block" /> Cancelled</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Recent Projects</h3>
            <a href="/projects" className="text-xs text-navy/50 hover:text-navy font-medium">View all →</a>
          </div>
          <div className="space-y-3">
            {mockProjects.slice(0, 5).map(p => (
              <div key={p.project_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{p.title}</p>
                  <p className="text-xs text-navy/50">{p.editor_name} · {p.client_name}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  <span className="text-xs text-navy/50 hidden sm:block">{formatCurrency(p.project_value)}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent disputes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Active Disputes</h3>
            <a href="/disputes" className="text-xs text-navy/50 hover:text-navy font-medium">View all →</a>
          </div>
          {mockDisputes.filter(d => d.status !== 'resolved').length === 0 ? (
            <div className="text-center py-10 text-navy/40 text-sm">No active disputes</div>
          ) : (
            <div className="space-y-3">
              {mockDisputes.filter(d => d.status !== 'resolved').map(d => (
                <div key={d.dispute_id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{d.project_title}</p>
                    <p className="text-xs text-navy/50 mt-0.5 line-clamp-1">{d.reason}</p>
                    <p className="text-xs text-navy/40 mt-1">SLA: {formatDate(d.sla_deadline)}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor performance summary */}
      {(role === 'superadmin' || role === 'admin_manager') && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Editor Roster</h3>
            <a href="/performance" className="text-xs text-navy/50 hover:text-navy font-medium">View KPI →</a>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Editor</th><th>Department</th><th>Active Projects</th><th>Rating</th><th>Status</th><th>Performance</th></tr></thead>
              <tbody>
                {mockEditors.map(e => (
                  <tr key={e.editor_id}>
                    <td className="font-medium text-navy">{e.full_name}</td>
                    <td>{e.department}</td>
                    <td><span className="font-medium">{e.active_projects}</span></td>
                    <td><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" />{e.rating.toFixed(1)}</span></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td><StatusBadge status={e.performance_band} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
