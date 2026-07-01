import { useMemo, useState } from 'react'
import { Building2, Plus, Check, Sparkles, Pencil, Star, Clock } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/page/PageHeader'
import { StatusBadge } from '../../components/ui/Badge'
import {
  mockDepartments, mockAdminManagers, mockEditors, mockProjects,
  mockLeaveRequests, mockUsers,
} from '../../data/mockData'
import type { Department, Editor, Project, UserRole } from '../../types'

const SPEC_LABELS: Record<string, string> = {
  product_retouch: 'Product Retouch',
  color_correction: 'Color Correction',
  video_edit: 'Video Edit',
  color_grading: 'Color Grading',
  portrait_retouch: 'Portrait Retouch',
  background_removal: 'BG Removal',
  vfx: 'VFX',
  motion_graphics: 'Motion Graphics',
}

// Only active editors can be assigned to a department.
const ACTIVE_EDITORS = mockEditors.filter(e => e.status === 'active')
const ALL_SKILLS = Array.from(new Set(ACTIVE_EDITORS.flatMap(e => e.specialization)))

export default function DepartmentsPage({ role, embedded = false }: { role: UserRole; embedded?: boolean }) {
  // Admin Manager sees their own department (team + presensi + KPI + proyek);
  // HR Admin manages the full department structure.
  if (role === 'admin_manager') return <ManagerDepartmentView embedded={embedded} />
  return <HrDepartmentsView role={role} />
}

function HrDepartmentsView({ role }: { role: UserRole }) {
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  function addDepartment(dep: Department) {
    setDepartments(prev => [dep, ...prev])
    setShowAdd(false)
  }
  function updateDepartment(dep: Department) {
    setDepartments(prev => prev.map(d => (d.id === dep.id ? dep : d)))
    setEditing(null)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="Struktur Tim"
        title="Departemen"
        description="Kelola departemen, tunjuk manajer, dan tetapkan editor sesuai keahlian."
        role={role}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-navy/60">{departments.length} departemen aktif</p>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Tambah Departemen
        </button>
      </div>

      <div className="space-y-4">
        {departments.map(d => (
          <DepartmentCard key={d.id} department={d} onManage={() => setEditing(d)} />
        ))}
      </div>

      {/* Add / Manage share one form. */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Departemen" size="md">
        <DepartmentForm submitLabel="Simpan Departemen" onSubmit={addDepartment} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Kelola Departemen" size="md">
        {editing && (
          <DepartmentForm
            initial={editing}
            submitLabel="Simpan Perubahan"
            onSubmit={updateDepartment}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function DepartmentCard({ department, onManage }: { department: Department; onManage: () => void }) {
  const manager = mockAdminManagers.find(m => m.id === department.manager_id)
  const members = ACTIVE_EDITORS.filter(e => department.member_ids.includes(e.editor_id))

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-navy text-white shrink-0">
          <Building2 className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy truncate">{department.name}</h3>
          <p className="text-xs text-navy/50">{members.length} anggota</p>
        </div>
        <button onClick={onManage} className="btn-secondary text-xs py-1.5 px-3 shrink-0">
          <Pencil className="w-3.5 h-3.5" /> Kelola
        </button>
      </div>

      {/* Manager */}
      <div className="flex items-center gap-3 rounded-xl border border-navy/10 bg-navy/[0.03] p-3">
        <Avatar name={manager?.full_name ?? '—'} avatar={manager?.avatar} />
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-navy/40">Manajer</p>
          <p className="text-sm font-semibold text-navy truncate">{manager?.full_name ?? 'Belum ditunjuk'}</p>
        </div>
      </div>

      {/* Members */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-navy/40 mb-2">Anggota</p>
        {members.length === 0 ? (
          <p className="text-sm text-navy/40">Belum ada anggota.</p>
        ) : (
          <ul className="space-y-2.5">
            {members.map(e => (
              <li key={e.editor_id} className="flex items-center gap-3">
                <Avatar name={e.full_name} avatar={e.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy truncate">{e.full_name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {e.specialization.map(s => <SkillTag key={s} skill={s} />)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DepartmentForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial?: Department
  submitLabel: string
  onSubmit: (dep: Department) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [managerId, setManagerId] = useState(initial?.manager_id ?? mockAdminManagers[0]?.id ?? '')
  const [skill, setSkill] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>(initial?.member_ids ?? [])
  const [error, setError] = useState('')

  // Editors whose expertise matches the chosen focus skill — surfaced as suggested.
  const suggestedIds = useMemo(
    () => (skill ? ACTIVE_EDITORS.filter(e => e.specialization.includes(skill)).map(e => e.editor_id) : []),
    [skill],
  )

  function pickSkill(s: string) {
    const next = skill === s ? '' : s
    setSkill(next)
    if (next) {
      // Auto-select the relevant editors; keep any manual picks already made.
      const relevant = ACTIVE_EDITORS.filter(e => e.specialization.includes(next)).map(e => e.editor_id)
      setMemberIds(prev => Array.from(new Set([...prev, ...relevant])))
    }
  }

  function toggleMember(id: string) {
    setMemberIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  function submit() {
    if (!name.trim()) { setError('Nama departemen wajib diisi'); return }
    onSubmit({
      id: initial?.id ?? `d-${Date.now()}`,
      name: name.trim(),
      manager_id: managerId,
      member_ids: memberIds,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nama Departemen</label>
        <input
          className="input"
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="mis. Motion Graphics"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <div>
        <label className="label">Manajer</label>
        <select className="input" value={managerId} onChange={e => setManagerId(e.target.value)}>
          {mockAdminManagers.map(m => (
            <option key={m.id} value={m.id}>{m.full_name} — {m.department}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Keahlian utama <span className="text-navy/40 font-normal">(saran anggota)</span></label>
        <div className="flex flex-wrap gap-2">
          {ALL_SKILLS.map(s => (
            <button
              type="button"
              key={s}
              onClick={() => pickSkill(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${skill === s ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-border hover:border-navy/30'}`}
            >
              {SPEC_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Anggota <span className="text-navy/40 font-normal">({memberIds.length} dipilih)</span></label>
        <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
          {ACTIVE_EDITORS.map(e => {
            const checked = memberIds.includes(e.editor_id)
            const suggested = suggestedIds.includes(e.editor_id)
            return (
              <li key={e.editor_id}>
                <button
                  type="button"
                  onClick={() => toggleMember(e.editor_id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${checked ? 'border-navy bg-navy/5' : 'border-border hover:border-navy/30'}`}
                >
                  <span className={`w-5 h-5 rounded-md border grid place-items-center shrink-0 ${checked ? 'bg-navy border-navy text-white' : 'border-navy/30'}`}>
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-navy truncate">{e.full_name}</p>
                      {suggested && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" /> Disarankan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy/50 truncate">
                      {e.specialization.map(s => SPEC_LABELS[s] ?? s).join(' · ')}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button className="btn-secondary" onClick={onCancel}>Batal</button>
        <button className="btn-primary" onClick={submit}>{submitLabel}</button>
      </div>
    </div>
  )
}

// ─── Admin Manager: my department (presensi + KPI + proyek in one place) ──────
const TODAY = '2026-06-26'
const CLOCK_INS = ['08:00', '08:05', '07:58', '08:12', '08:03']
const BAND_LABEL: Record<Editor['performance_band'], string> = {
  excellent: 'Sangat Baik',
  good: 'Baik',
  needs_improvement: 'Perlu Peningkatan',
}
const BAND_STYLE: Record<Editor['performance_band'], string> = {
  excellent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  good: 'text-blue-700 bg-blue-50 border-blue-200',
  needs_improvement: 'text-amber-700 bg-amber-50 border-amber-200',
}

function isOnLeaveToday(name: string): boolean {
  return mockLeaveRequests.some(l =>
    l.editor_name === name && l.requester_role === 'editor' &&
    l.status !== 'rejected' && l.start_date <= TODAY && TODAY <= l.end_date,
  )
}

function ManagerDepartmentView({ embedded = false }: { embedded?: boolean }) {
  // Current Admin Manager (mock) → the department they lead.
  const managerId = mockUsers.admin_manager.user_id
  const dept = mockDepartments.find(d => d.manager_id === managerId) ?? mockDepartments[0]
  const editors = mockEditors.filter(e => dept.member_ids.includes(e.editor_id))
  const deptProjects = mockProjects.filter(p => editors.some(e => e.editor_id === p.editor_id))
  const activeProjects = deptProjects.filter(p => !['completed', 'cancelled'].includes(p.status)).length
  const avgRating = editors.length ? editors.reduce((s, e) => s + e.rating, 0) / editors.length : 0

  return (
    <div className="space-y-6 max-w-3xl">
      {!embedded && (
        <PageHeader
          eyebrow="Departemen Saya"
          title={dept.name}
          description="Pantau editor tim Anda — presensi, KPI, dan proyek dalam satu halaman."
          role="admin_manager"
        />
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard value={String(editors.length)} label="Editor" />
        <StatCard value={String(activeProjects)} label="Proyek Aktif" />
        <StatCard value={avgRating.toFixed(1)} label="Rata-rata Rating" />
      </div>

      <div className="space-y-4">
        {editors.map((e, i) => (
          <EditorDeptCard
            key={e.editor_id}
            editor={e}
            clockIn={CLOCK_INS[i % CLOCK_INS.length]}
            projects={mockProjects.filter(p => p.editor_id === e.editor_id)}
          />
        ))}
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card text-center py-4">
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-navy/60 mt-0.5">{label}</p>
    </div>
  )
}

function EditorDeptCard({ editor, clockIn, projects }: { editor: Editor; clockIn: string; projects: Project[] }) {
  const onLeave = isOnLeaveToday(editor.full_name)
  return (
    <div className="card space-y-4">
      {/* Identity + presensi */}
      <div className="flex items-start gap-3">
        <Avatar name={editor.full_name} avatar={editor.avatar} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy truncate">{editor.full_name}</p>
          <p className="text-xs text-navy/50 truncate">
            {editor.specialization.map(s => SPEC_LABELS[s] ?? s).join(' · ')}
          </p>
        </div>
        {onLeave ? (
          <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shrink-0">
            Cuti
          </span>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0 inline-flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5" /> {clockIn}
          </span>
        )}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2">
        <KpiCell label="Rating" value={editor.rating.toFixed(1)} icon={<Star className="w-3.5 h-3.5 text-amber-500" />} />
        <KpiCell label="Penyelesaian" value={`${editor.completion_rate}%`} />
        <div className="rounded-xl border border-border px-3 py-2.5 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-wider text-navy/40">Kinerja</p>
          <span className={`mt-0.5 inline-flex w-fit text-[11px] font-semibold px-2 py-0.5 rounded-full border ${BAND_STYLE[editor.performance_band]}`}>
            {BAND_LABEL[editor.performance_band]}
          </span>
        </div>
      </div>

      {/* Projects */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-navy/40 mb-2">Proyek ({projects.length})</p>
        {projects.length === 0 ? (
          <p className="text-sm text-navy/40">Tidak ada proyek aktif.</p>
        ) : (
          <ul className="divide-y divide-border">
            {projects.map(p => (
              <li key={p.project_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm text-navy truncate">{p.title}</span>
                <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function KpiCell({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-navy/40">{label}</p>
      <p className="text-sm font-bold text-navy mt-0.5 flex items-center gap-1">{icon}{value}</p>
    </div>
  )
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="text-[10px] font-medium text-navy/60 bg-navy/5 px-1.5 py-0.5 rounded">
      {SPEC_LABELS[skill] ?? skill}
    </span>
  )
}

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) return <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
  return (
    <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center text-xs font-semibold text-navy shrink-0">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
    </div>
  )
}
