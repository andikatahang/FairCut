import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatDateTime, formatDate } from '../../lib/utils'
import { mockDisputes } from '../../data/mockData'
import type { Dispute, UserRole } from '../../types'
import { PageHeader } from '../../components/page/PageHeader'

const HEADER_BY_ROLE: Record<UserRole, { eyebrow: string; title: string; description: string }> = {
  superadmin:     { eyebrow: 'Jalur darurat', title: 'Sengketa — Fallback Queue', description: 'Kasus yang ter-override cron `disputeSlaWatchdog` karena MEDIATOR lalai > 48 jam.' },
  hr_admin:       { eyebrow: 'Sengketa', title: 'Sengketa', description: '' },
  admin_manager:  { eyebrow: 'Sengketa', title: 'Sengketa', description: '' },
  editor:         { eyebrow: 'Sengketa', title: 'Sengketa Saya', description: '' },
  client:         { eyebrow: 'Sengketa', title: 'Sengketa Saya', description: '' },
  mediator:       { eyebrow: 'Queue mediasi', title: 'Penyelesaian Sengketa', description: 'Kasus ditugaskan ke Anda — SLA 48 jam, resolution_note minimal 200 karakter.' },
  finance:        { eyebrow: 'Sengketa', title: 'Sengketa', description: '' },
}

const resolutionOptions = [
  { value: 'free_revision', label: 'Revisi Gratis', desc: 'Editor mengerjakan ulang tanpa biaya' },
  { value: 'charge_justified', label: 'Biaya Wajar', desc: 'Klien membayar top-up' },
  { value: 'partial_refund', label: 'Pengembalian Sebagian', desc: 'Kompromi pengembalian (10–50%)' },
  { value: 'full_refund', label: 'Pengembalian Penuh', desc: 'Pengembalian penuh ke klien' },
  { value: 'quality_sanction', label: 'Sanksi Mutu', desc: 'Revisi gratis + tanda untuk editor' },
]

export default function DisputesPage({ role }: { role: UserRole }) {
  const isMediator = role === 'mediator' || role === 'superadmin'
  const [selected, setSelected] = useState<Dispute | null>(mockDisputes[0])
  const [decideModal, setDecideModal] = useState(false)
  const [resolution, setResolution] = useState('')
  const [note, setNote] = useState('')

  const slaHoursLeft = (d: Dispute) => {
    const ms = new Date(d.sla_deadline).getTime() - Date.now()
    const h = Math.floor(ms / 3600000)
    return h > 0 ? `sisa ${h} jam` : 'SLA terlewati'
  }

  const h = HEADER_BY_ROLE[role] ?? HEADER_BY_ROLE.mediator

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={h.eyebrow} title={h.title} description={h.description} role={role} />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-3xl font-bold text-red-600">{mockDisputes.filter(d=>d.status==='open').length}</p><p className="text-sm text-navy/60 mt-1">Terbuka</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-amber-600">{mockDisputes.filter(d=>d.status==='in_mediation').length}</p><p className="text-sm text-navy/60 mt-1">Mediasi</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-emerald-600">{mockDisputes.filter(d=>d.status==='resolved').length}</p><p className="text-sm text-navy/60 mt-1">Selesai</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-3">
          {mockDisputes.map(d => (
            <button key={d.dispute_id} onClick={() => setSelected(d)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.dispute_id === d.dispute_id ? 'border-navy bg-navy-50' : 'bg-white border-border hover:border-navy/20'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-navy leading-tight">{d.project_title}</p>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-xs text-navy/50 line-clamp-2">{d.reason}</p>
              {d.status !== 'resolved' && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${slaHoursLeft(d).includes('terlewati') ? 'text-red-600' : 'text-amber-600'}`}>
                  <Clock className="w-3 h-3" /> {slaHoursLeft(d)}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="card space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy">{selected.project_title}</h2>
                  <p className="text-sm text-navy/50 mt-0.5">Dibuka {formatDateTime(selected.opened_at)} oleh {selected.opened_by}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-800 mb-1">Alasan Sengketa</p>
                <p className="text-sm text-red-700">{selected.reason}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-primary-200 rounded-xl p-4">
                  <p className="text-xs text-navy/50 mb-1">Klien</p>
                  <p className="font-semibold text-navy">{selected.client_name}</p>
                </div>
                <div className="bg-primary-200 rounded-xl p-4">
                  <p className="text-xs text-navy/50 mb-1">Editor</p>
                  <p className="font-semibold text-navy">{selected.editor_name}</p>
                </div>
              </div>

              {/* Evidence checklist */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3">Paket Bukti</h3>
                <div className="space-y-2">
                  {['Revision Envelope (INCLUDED/EXCLUDED/ALLOWANCE)','Riwayat & deskripsi revisi','Hasil deteksi perubahan AI','Rating & umpan balik klien','Log chat (klien–editor)'].map(item => (
                    <div key={item} className="flex items-center gap-2 p-2.5 bg-primary-200 rounded-lg">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      </div>
                      <span className="text-sm text-navy">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selected.resolution_type ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-800 mb-1">Penyelesaian: {selected.resolution_type.replace(/_/g,' ')}</p>
                  <p className="text-sm text-emerald-700">{selected.resolution_note}</p>
                  <p className="text-xs text-emerald-600 mt-2">Diselesaikan {selected.resolved_at ? formatDate(selected.resolved_at) : '—'}</p>
                </div>
              ) : isMediator ? (
                <div className="flex gap-3">
                  <button onClick={() => setDecideModal(true)} className="btn-primary flex-1 justify-center">
                    <AlertTriangle className="w-4 h-4" /> Buat Keputusan
                  </button>
                  <button className="btn-secondary">Minta Bukti Tambahan</button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  Menunggu keputusan mediator.
                </div>
              )}

              {selected.status !== 'resolved' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Tenggat SLA: <strong>{formatDateTime(selected.sla_deadline)}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64 text-navy/30">
              <AlertTriangle className="w-10 h-10" />
            </div>
          )}
        </div>
      </div>

      <Modal open={decideModal} onClose={() => setDecideModal(false)} title="Keputusan Mediator" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {resolutionOptions.map(opt => (
              <button key={opt.value} onClick={() => setResolution(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${resolution === opt.value ? 'border-navy bg-navy-50' : 'border-border hover:border-navy/30'}`}>
                <p className={`text-sm font-medium ${resolution === opt.value ? 'text-navy' : 'text-navy/80'}`}>{opt.label}</p>
                <p className="text-xs text-navy/50 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="label">Catatan penyelesaian <span className="text-navy/40">(min. 200 karakter)</span></label>
            <textarea className="input h-32 resize-none" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Jelaskan alasan Anda secara rinci. Ini akan dicatat permanen di jejak audit…" />
            <p className="text-xs text-navy/40 mt-1 text-right">{note.length} karakter</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1 justify-center" disabled={!resolution || note.length < 10}>Konfirmasi Keputusan</button>
            <button className="btn-secondary" onClick={() => setDecideModal(false)}>Batal</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
