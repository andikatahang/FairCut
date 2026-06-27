import { useState } from 'react'
import {
  Briefcase, ChevronLeft, User, Building2, Calendar,
  CheckCircle2, AlertCircle, Clock, Layers, ArrowRight,
  RotateCcw, ShieldAlert, Bot, DollarSign,
  Camera, Film, MessageCircle, CreditCard, Eye,
} from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils'
import {
  mockProjects, mockRevisions, mockEscrowAccounts,
  mockTransactions, mockRevisionEnvelopes,
} from '../../data/mockData'
import type { Project, ProjectStatus, UserRole } from '../../types'

type Tab = 'overview' | 'revisions' | 'escrow'

const ALL_STATUSES: ProjectStatus[] = [
  'in_progress', 'in_review', 'revision', 'disputed', 'awaiting_dp', 'completed', 'cancelled',
]

const ESCROW_STATES = [
  { key: 'dp', label: 'DP Received', icon: DollarSign },
  { key: 'final', label: 'Final Received', icon: DollarSign },
  { key: 'released', label: 'Released', icon: CheckCircle2 },
]

function escrowStep(status: ProjectStatus): number {
  if (['awaiting_dp', 'draft'].includes(status)) return 0
  if (['in_progress', 'in_review', 'revision', 'disputed'].includes(status)) return 1
  if (status === 'completed') return 3
  return 0
}

function RevisionEnvelopeBar({ consumed, total }: { consumed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min((consumed / total) * 100, 100)
  const color = pct >= 100 ? 'bg-red-500' : pct >= 66 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-xs text-navy/50 mb-1">
        <span>{consumed} used</span>
        <span>{total - consumed} remaining</span>
      </div>
      <div className="h-1.5 bg-navy/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AiConfidencePill({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = pct >= 85 ? 'text-emerald-700 bg-emerald-50' : pct >= 70 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${color}`}>
      <Bot className="w-3 h-3" /> {pct}%
    </span>
  )
}

// ─── Client Grid View ────────────────────────────────────────────────────────

const STATUS_PROGRESS: Record<string, number> = {
  draft: 0, awaiting_dp: 10, in_progress: 45,
  in_review: 75, revision: 55, disputed: 60,
  completed: 100, cancelled: 0,
}

const THUMB_GRADIENT: Record<string, string> = {
  awaiting_dp: 'from-gray-300 to-slate-400',
  in_progress: 'from-blue-400 to-indigo-500',
  in_review: 'from-violet-400 to-purple-500',
  revision: 'from-amber-400 to-orange-500',
  disputed: 'from-red-400 to-rose-500',
  completed: 'from-emerald-400 to-teal-500',
  cancelled: 'from-gray-200 to-gray-300',
}

function projectIcon(title: string) {
  const t = title.toLowerCase()
  if (t.includes('video') || t.includes('film')) return Film
  if (t.includes('photo') || t.includes('portrait') || t.includes('retouch')) return Camera
  return Briefcase
}

function ProgressBar({ status }: { status: string }) {
  const pct = STATUS_PROGRESS[status] ?? 0
  const color = pct === 100
    ? 'bg-emerald-500'
    : pct >= 60 ? 'bg-blue-500'
    : pct >= 40 ? 'bg-indigo-400'
    : 'bg-gray-300'
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span className="font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ClientProjectCard({
  project,
  onView,
}: {
  project: Project
  onView: (p: Project) => void
}) {
  const gradient = THUMB_GRADIENT[project.status] ?? 'from-gray-200 to-gray-300'
  const Icon = projectIcon(project.title)
  const isPaying = project.status === 'in_review'

  return (
    <div
      onClick={() => onView(project)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <Icon className="w-10 h-10 text-white/80 group-hover:scale-110 transition-transform duration-200" />
        <div className="absolute top-3 right-3">
          <StatusBadge status={project.status} />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title + editor */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{project.title}</h3>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            {project.editor_name}
          </p>
        </div>

        {/* Progress */}
        <ProgressBar status={project.status} />

        {/* Value */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Project value</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(project.project_value)}</span>
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <button
            onClick={e => { e.stopPropagation(); onView(project) }}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:border-navy hover:text-navy hover:bg-navy/5 transition-all"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          <button
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
          {isPaying && (
            <button
              onClick={e => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ClientProjectsView({
  filtered,
  filter,
  setFilter,
}: {
  filtered: Project[]
  filter: ProjectStatus | 'all'
  setFilter: (v: ProjectStatus | 'all') => void
}) {
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [revisionModal, setRevisionModal] = useState(false)
  const [revisionText, setRevisionText] = useState('')

  const statCounts = {
    active: mockProjects.filter(p => p.status === 'in_progress').length,
    review: mockProjects.filter(p => p.status === 'in_review').length,
    completed: mockProjects.filter(p => p.status === 'completed').length,
  }

  function openDetail(p: Project) {
    setDetailProject(p)
    setTab('overview')
  }

  const revisions = detailProject ? mockRevisions.filter(r => r.project_id === detailProject.project_id) : []
  const envelope = detailProject ? mockRevisionEnvelopes.find(e => e.project_id === detailProject.project_id) : undefined
  const escrow = detailProject ? mockEscrowAccounts.find(e => e.project_id === detailProject.project_id) : undefined
  const transactions = detailProject ? mockTransactions.filter(t => t.project_id === detailProject.project_id) : []
  const step = detailProject ? escrowStep(detailProject.status) : 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{statCounts.active}</p>
          <p className="text-xs text-gray-400 mt-0.5">In Progress</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{statCounts.review}</p>
          <p className="text-xs text-gray-400 mt-0.5">In Review</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{statCounts.completed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === 'all' ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
        >
          All ({mockProjects.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = mockProjects.filter(p => p.status === s).length
          if (!count) return null
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${filter === s ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
            >
              {s.replace(/_/g, ' ')} ({count})
            </button>
          )
        })}
      </div>

      {/* Project grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Briefcase className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => (
            <ClientProjectCard key={p.project_id} project={p} onView={openDetail} />
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detailProject} onClose={() => setDetailProject(null)} title={detailProject?.title ?? ''} size="xl">
        {detailProject && (
          <div>
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{detailProject.editor_name}</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{detailProject.client_name}</span>
              {detailProject.started_at && (
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Started {formatDate(detailProject.started_at)}</span>
              )}
              <span className="flex items-center gap-1.5 font-bold text-gray-900">{formatCurrency(detailProject.project_value)}</span>
              <StatusBadge status={detailProject.status} />
            </div>

            {/* Role actions */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {detailProject.status === 'in_review' && (
                <button className="btn-primary text-xs py-2 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Pay Final
                </button>
              )}
              {['in_progress', 'in_review'].includes(detailProject.status) && (
                <button onClick={() => setRevisionModal(true)} className="btn-secondary text-xs py-2 px-3">
                  <RotateCcw className="w-3.5 h-3.5" /> Submit Revision
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 mb-5">
              {(['overview', 'revisions', 'escrow'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-all capitalize ${tab === t ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
                >
                  {t}
                  {t === 'revisions' && revisions.length > 0 && (
                    <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{revisions.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === 'overview' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment Escrow</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ESCROW_STATES.map((s, i) => (
                      <div key={s.key} className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${step > i ? 'bg-emerald-50 text-emerald-700' : step === i ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-400'}`}>
                          <s.icon className="w-3.5 h-3.5" />
                          {s.label}
                        </div>
                        {i < ESCROW_STATES.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                      </div>
                    ))}
                  </div>
                  {escrow && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(escrow.held_balance)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Held</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-emerald-700">{formatCurrency(escrow.released_balance)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Released</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-amber-700">{formatCurrency(escrow.refunded_balance)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Refunded</p>
                      </div>
                    </div>
                  )}
                </div>
                {envelope && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Revision Envelope</p>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">Included Scope</span>
                        </div>
                        <p className="text-xs text-gray-600">{envelope.included_scope}</p>
                      </div>
                      <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-600">Excluded Scope</span>
                        </div>
                        <p className="text-xs text-gray-600">{envelope.excluded_scope}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-600">
                            Free Allowance — {envelope.allowance_consumed}/{envelope.allowance_count} used
                          </span>
                        </div>
                        <RevisionEnvelopeBar consumed={envelope.allowance_consumed} total={envelope.allowance_count} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Revisions */}
            {tab === 'revisions' && (
              <div>
                {revisions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No revisions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {revisions.map(r => (
                      <div key={r.revision_id} className="rounded-xl border border-gray-100 p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-gray-800 leading-snug">{r.request_text}</p>
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400">AI label:</span>
                          <StatusBadge status={r.ai_label} />
                          <AiConfidencePill confidence={r.ai_confidence} />
                          {r.price !== undefined && r.price > 0 && (
                            <span className="text-xs font-semibold text-amber-700 ml-auto">{formatCurrency(r.price)} top-up</span>
                          )}
                          {r.price === 0 && (
                            <span className="text-xs text-emerald-700 font-medium ml-auto">Free</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{formatDateTime(r.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Escrow */}
            {tab === 'escrow' && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction History</p>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(t => (
                      <div key={t.transaction_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{t.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(t.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(t.amount)}</p>
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Submit Revision Modal */}
      <Modal open={revisionModal} onClose={() => setRevisionModal(false)} title="Submit Revision Request">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Describe the changes you need. Our AI will classify the revision as minor (free) or major (additional charge).</p>
          <div>
            <label className="label">Revision Details</label>
            <textarea
              rows={4}
              value={revisionText}
              onChange={e => setRevisionText(e.target.value)}
              className="input resize-none"
              placeholder="e.g. The background on photo #3 needs to be slightly brighter..."
            />
          </div>
          {envelope && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Free Allowance Remaining</p>
              <RevisionEnvelopeBar consumed={envelope.allowance_consumed} total={envelope.allowance_count} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setRevisionModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => setRevisionModal(false)} className="btn-primary">Submit Request</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectsPage({ role }: { role: UserRole }) {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [selected, setSelected] = useState<Project>(mockProjects[0])
  const [tab, setTab] = useState<Tab>('overview')
  const [showMobile, setShowMobile] = useState(false)
  const [revisionModal, setRevisionModal] = useState(false)
  const [revisionText, setRevisionText] = useState('')

  const isClient = role === 'client'
  const isEditor = role === 'editor'
  const isAdmin = role === 'superadmin' || role === 'admin_manager'

  const filtered = filter === 'all' ? mockProjects : mockProjects.filter(p => p.status === filter)

  // Client gets the e-commerce grid view
  if (isClient) {
    return <ClientProjectsView filtered={filtered} filter={filter} setFilter={setFilter} />
  }

  const revisions = mockRevisions.filter(r => r.project_id === selected.project_id)
  const envelope = mockRevisionEnvelopes.find(e => e.project_id === selected.project_id)
  const escrow = mockEscrowAccounts.find(e => e.project_id === selected.project_id)
  const transactions = mockTransactions.filter(t => t.project_id === selected.project_id)
  const step = escrowStep(selected.status)

  function selectProject(p: Project) {
    setSelected(p)
    setTab('overview')
    setShowMobile(true)
  }

  const statCounts = {
    active: mockProjects.filter(p => p.status === 'in_progress').length,
    review: mockProjects.filter(p => p.status === 'in_review').length,
    disputed: mockProjects.filter(p => p.status === 'disputed').length,
    completed: mockProjects.filter(p => p.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{statCounts.active}</p>
          <p className="text-xs text-navy/60 mt-0.5">In Progress</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-navy">{statCounts.review}</p>
          <p className="text-xs text-navy/60 mt-0.5">In Review</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-red-600">{statCounts.disputed}</p>
          <p className="text-xs text-navy/60 mt-0.5">Disputed</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-emerald-600">{statCounts.completed}</p>
          <p className="text-xs text-navy/60 mt-0.5">Completed</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === 'all' ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-border hover:border-navy/30'}`}
        >
          All ({mockProjects.length})
        </button>
        {ALL_STATUSES.map(s => {
          const count = mockProjects.filter(p => p.status === s).length
          if (!count) return null
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === s ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-border hover:border-navy/30'}`}
            >
              {s.replace(/_/g, ' ')} ({count})
            </button>
          )
        })}
      </div>

      {/* Master-detail */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Project list */}
        <div className={`space-y-2 ${showMobile ? 'hidden lg:block' : ''}`}>
          {filtered.length === 0 && (
            <div className="card text-center py-12 text-navy/30">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No projects found</p>
            </div>
          )}
          {filtered.map(p => (
            <button
              key={p.project_id}
              onClick={() => selectProject(p)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.project_id === p.project_id ? 'border-navy bg-navy-50' : 'bg-white border-border hover:border-navy/20'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-navy leading-tight">{p.title}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-navy/50 mb-2 line-clamp-1">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-navy/50">{p.client_name}</span>
                <span className="text-xs font-semibold text-navy">{formatCurrency(p.project_value)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className={`lg:col-span-2 ${!showMobile ? 'hidden lg:block' : ''}`}>
          <div className="card p-0 overflow-hidden">
            {/* Detail header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => setShowMobile(false)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-navy-50 text-navy/50 shrink-0 mt-0.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-base font-semibold text-navy leading-tight">{selected.title}</h2>
                      <p className="text-xs text-navy/50 mt-0.5">{selected.description}</p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-navy/60">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{selected.editor_name}</span>
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{selected.client_name}</span>
                    {selected.started_at && (
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Started {formatDate(selected.started_at)}</span>
                    )}
                    <span className="flex items-center gap-1.5 font-semibold text-navy">{formatCurrency(selected.project_value)}</span>
                  </div>
                </div>
              </div>

              {/* Role actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {isClient && selected.status === 'in_review' && (
                  <button className="btn-primary text-xs py-2 px-3">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Pay Final
                  </button>
                )}
                {isClient && ['in_progress', 'in_review'].includes(selected.status) && (
                  <button onClick={() => setRevisionModal(true)} className="btn-secondary text-xs py-2 px-3">
                    <RotateCcw className="w-3.5 h-3.5" /> Submit Revision
                  </button>
                )}
                {isEditor && selected.status === 'in_progress' && (
                  <button className="btn-primary text-xs py-2 px-3">
                    <ArrowRight className="w-3.5 h-3.5" /> Submit for Review
                  </button>
                )}
                {selected.status === 'disputed' && (role === 'mediator' || isAdmin) && (
                  <button className="btn-secondary text-xs py-2 px-3">
                    <ShieldAlert className="w-3.5 h-3.5" /> Open Dispute Panel
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['overview', 'revisions', 'escrow'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-all capitalize ${tab === t ? 'border-navy text-navy' : 'border-transparent text-navy/50 hover:text-navy'}`}
                >
                  {t}
                  {t === 'revisions' && revisions.length > 0 && (
                    <span className="ml-1.5 bg-navy/10 text-navy text-xs px-1.5 py-0.5 rounded-full">{revisions.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {tab === 'overview' && (
              <div className="p-5 space-y-5">
                {/* Escrow snapshot */}
                <div>
                  <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Payment Escrow</p>
                  <div className="flex items-center gap-2">
                    {ESCROW_STATES.map((s, i) => (
                      <div key={s.key} className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${step > i ? 'bg-emerald-50 text-emerald-700' : step === i ? 'bg-navy-50 text-navy border border-navy/20' : 'bg-gray-50 text-navy/30'}`}>
                          <s.icon className="w-3.5 h-3.5" />
                          {s.label}
                        </div>
                        {i < ESCROW_STATES.length - 1 && <ArrowRight className="w-3 h-3 text-navy/20 shrink-0" />}
                      </div>
                    ))}
                  </div>
                  {escrow && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-navy-50/50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-navy">{formatCurrency(escrow.held_balance)}</p>
                        <p className="text-xs text-navy/50 mt-0.5">Held</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-emerald-700">{formatCurrency(escrow.released_balance)}</p>
                        <p className="text-xs text-navy/50 mt-0.5">Released</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-amber-700">{formatCurrency(escrow.refunded_balance)}</p>
                        <p className="text-xs text-navy/50 mt-0.5">Refunded</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Revision envelope */}
                {envelope && (
                  <div>
                    <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Revision Envelope</p>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">Included Scope</span>
                        </div>
                        <p className="text-xs text-navy/70">{envelope.included_scope}</p>
                      </div>
                      <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-600">Excluded Scope</span>
                        </div>
                        <p className="text-xs text-navy/70">{envelope.excluded_scope}</p>
                      </div>
                      <div className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-navy/60" />
                          <span className="text-xs font-semibold text-navy/70">
                            Free Revision Allowance — {envelope.allowance_consumed}/{envelope.allowance_count} used
                          </span>
                        </div>
                        <RevisionEnvelopeBar consumed={envelope.allowance_consumed} total={envelope.allowance_count} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Revisions */}
            {tab === 'revisions' && (
              <div className="p-5">
                {revisions.length === 0 ? (
                  <div className="text-center py-10 text-navy/30">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No revisions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {revisions.map(r => (
                      <div key={r.revision_id} className="rounded-xl border border-border p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-navy leading-snug">{r.request_text}</p>
                          <StatusBadge status={r.status} />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-navy/50">AI label:</span>
                          <StatusBadge status={r.ai_label} />
                          <AiConfidencePill confidence={r.ai_confidence} />
                          {r.final_label && r.final_label !== r.ai_label && (
                            <>
                              <span className="text-xs text-navy/40">→ Final:</span>
                              <StatusBadge status={r.final_label} />
                            </>
                          )}
                          {r.price !== undefined && r.price > 0 && (
                            <span className="text-xs font-semibold text-amber-700 ml-auto">{formatCurrency(r.price)} top-up</span>
                          )}
                          {r.price === 0 && (
                            <span className="text-xs text-emerald-700 font-medium ml-auto">Free</span>
                          )}
                        </div>
                        <p className="text-xs text-navy/40">{formatDateTime(r.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Escrow */}
            {tab === 'escrow' && (
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider">Transaction History</p>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-navy/30">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(t => (
                      <div key={t.transaction_id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-navy capitalize">{t.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-navy/40 mt-0.5">{formatDateTime(t.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-navy">{formatCurrency(t.amount)}</p>
                          <StatusBadge status={t.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Revision Modal */}
      <Modal open={revisionModal} onClose={() => setRevisionModal(false)} title="Submit Revision Request">
        <div className="space-y-4">
          <p className="text-sm text-navy/60">Describe the changes you need. Our AI will classify the revision as minor (free) or major (additional charge).</p>
          <div>
            <label className="label">Revision Details</label>
            <textarea
              rows={4}
              value={revisionText}
              onChange={e => setRevisionText(e.target.value)}
              className="input resize-none"
              placeholder="e.g. The background on photo #3 needs to be slightly brighter..."
            />
          </div>
          {envelope && (
            <div className="bg-navy-50/50 rounded-xl p-3">
              <p className="text-xs text-navy/60 mb-1">Free Allowance Remaining</p>
              <RevisionEnvelopeBar consumed={envelope.allowance_consumed} total={envelope.allowance_count} />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setRevisionModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => setRevisionModal(false)} className="btn-primary">Submit Request</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
