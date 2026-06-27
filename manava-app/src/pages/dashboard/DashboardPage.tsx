import { Briefcase, Users, AlertTriangle, CreditCard, TrendingUp, Clock, Search, MessageSquare, CheckCircle2 } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockProjects, mockEditors, mockDisputes, mockTransactions } from '../../data/mockData'
import type { UserRole } from '../../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 24000000 }, { month: 'Feb', revenue: 18000000 },
  { month: 'Mar', revenue: 32000000 }, { month: 'Apr', revenue: 28000000 },
  { month: 'Mei', revenue: 41000000 }, { month: 'Jun', revenue: 38000000 },
]
const projectData = [
  { month: 'Jan', completed: 5, cancelled: 1 }, { month: 'Feb', completed: 4, cancelled: 0 },
  { month: 'Mar', completed: 8, cancelled: 1 }, { month: 'Apr', completed: 7, cancelled: 2 },
  { month: 'Mei', completed: 10, cancelled: 1 }, { month: 'Jun', completed: 9, cancelled: 0 },
]

function ClientDashboardView() {
  const activeProjects = mockProjects.filter(p => ['in_progress', 'in_review', 'revision'].includes(p.status))
  const pendingReview = mockProjects.filter(p => p.status === 'in_review')
  const openDisputes = mockDisputes.filter(d => d.status !== 'resolved')
  const totalSpent = mockTransactions
    .filter(t => ['dp_payment', 'final_payment'].includes(t.type) && t.status === 'success')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Proyek Aktif', value: activeProjects.length, color: 'text-[#1a1a1a]' },
          { label: 'Siap Ditinjau', value: pendingReview.length, color: 'text-[#16a34a]' },
          { label: 'Sengketa Terbuka', value: openDisputes.length, color: openDisputes.length > 0 ? 'text-[#ca8a04]' : 'text-[#1a1a1a]' },
          { label: 'Total Pengeluaran', value: formatCurrency(totalSpent), color: 'text-[#1a1a1a]', small: true },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#e4e4e4] rounded-2xl p-5">
            <p className={`${s.small ? 'text-xl' : 'text-3xl'} font-bold ${s.color} leading-none`}>{s.value}</p>
            <p className="text-sm text-[#888] mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a href="/browse-editors" className="flex items-center gap-2 bg-[#2b2b2b] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1a1a1a] transition-colors">
          <Search className="w-4 h-4" /> Cari Editor
        </a>
        <a href="/projects" className="flex items-center gap-2 border border-[#e4e4e4] text-[#1a1a1a] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#f0f0f0] transition-colors bg-white">
          <Briefcase className="w-4 h-4" /> Proyek Saya
        </a>
        <a href="/chat" className="flex items-center gap-2 border border-[#e4e4e4] text-[#1a1a1a] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#f0f0f0] transition-colors bg-white">
          <MessageSquare className="w-4 h-4" /> Chat
        </a>
      </div>

      {/* Recent projects + disputes */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#e4e4e4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a1a1a]">Proyek Saya</h3>
            <a href="/projects" className="text-xs text-[#888] hover:text-[#1a1a1a] transition-colors">Lihat semua →</a>
          </div>
          <div className="space-y-0">
            {mockProjects.slice(0, 5).map(p => (
              <div key={p.project_id} className="flex items-center justify-between py-3 border-b border-[#f0f0f0] last:border-0">
                <div className="min-w-0 mr-3">
                  <p className="text-sm font-medium text-[#1a1a1a] truncate">{p.title}</p>
                  <p className="text-xs text-[#999] mt-0.5">{p.editor_name}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e4e4e4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#1a1a1a]">Sengketa & Peringatan</h3>
            <a href="/disputes" className="text-xs text-[#888] hover:text-[#1a1a1a] transition-colors">Lihat semua →</a>
          </div>
          {openDisputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#bbb]">
              <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Tidak ada sengketa aktif</p>
            </div>
          ) : (
            <div className="space-y-0">
              {openDisputes.slice(0, 4).map(d => (
                <div key={d.dispute_id} className="flex items-start gap-3 py-3 border-b border-[#f0f0f0] last:border-0">
                  <AlertTriangle className="w-4 h-4 text-[#ca8a04] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{d.project_title}</p>
                    <p className="text-xs text-[#999] mt-0.5 line-clamp-1">{d.reason}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage({ role }: { role: UserRole }) {
  if (role === 'client') return <ClientDashboardView />
  const activeProjects = mockProjects.filter(p => ['in_progress','in_review','revision'].includes(p.status)).length
  const openDisputes = mockDisputes.filter(d => d.status === 'open' || d.status === 'in_mediation').length
  const totalRevenue = mockTransactions.filter(t => t.type === 'escrow_release' && t.status === 'success').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Proyek Aktif" value={activeProjects} icon={Briefcase} change="+2 minggu ini" changeType="up" accent="bg-blue-50" />
        <StatCard label="Editor Aktif" value={mockEditors.filter(e => e.status === 'active').length} icon={Users} change="1 onboarding" changeType="neutral" accent="bg-emerald-50" />
        <StatCard label="Sengketa Terbuka" value={openDisputes} icon={AlertTriangle} change="2 perlu perhatian" changeType={openDisputes > 0 ? 'down' : 'neutral'} accent="bg-amber-50" />
        <StatCard label="Total Pendapatan" value={formatCurrency(totalRevenue)} icon={CreditCard} change="+12% vs bulan lalu" changeType="up" accent="bg-navy-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-navy">Ringkasan Pendapatan</h3>
              <p className="text-xs text-navy/50 mt-0.5">Pencairan escrow bulanan</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" /> +18,4% YTD
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#022E5799' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Pendapatan']} contentStyle={{ borderRadius: '10px', border: '1px solid #E8EDF2', fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#022E57" strokeWidth={2.5} dot={{ fill: '#022E57', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by status */}
        <div className="card">
          <h3 className="font-semibold text-navy mb-4">Proyek per Bulan</h3>
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
            <div className="flex items-center gap-1.5 text-xs text-navy/60"><span className="w-3 h-3 bg-navy rounded-sm inline-block" /> Selesai</div>
            <div className="flex items-center gap-1.5 text-xs text-navy/60"><span className="w-3 h-3 bg-border rounded-sm inline-block" /> Dibatalkan</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy">Proyek Terbaru</h3>
            <a href="/projects" className="text-xs text-navy/50 hover:text-navy font-medium">Lihat semua →</a>
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
            <h3 className="font-semibold text-navy">Sengketa Aktif</h3>
            <a href="/disputes" className="text-xs text-navy/50 hover:text-navy font-medium">Lihat semua →</a>
          </div>
          {mockDisputes.filter(d => d.status !== 'resolved').length === 0 ? (
            <div className="text-center py-10 text-navy/40 text-sm">Tidak ada sengketa aktif</div>
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
            <h3 className="font-semibold text-navy">Daftar Editor</h3>
            <a href="/performance" className="text-xs text-navy/50 hover:text-navy font-medium">Lihat KPI →</a>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Editor</th><th>Departemen</th><th>Proyek Aktif</th><th>Rating</th><th>Status</th><th>Kinerja</th></tr></thead>
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
