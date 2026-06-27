import { useState, useRef } from 'react'
import { FileText, CheckCircle, XCircle, AlertCircle, Bot, Loader2, X } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockProjects, mockRevisions } from '../../data/mockData'
import type { RevisionRequest } from '../../types'

// ─── AI classifier mock ────────────────────────────────────────────────────
const MAJOR_KEYWORDS = [
  'replace', 'swap', 'remove', 'background', 'different', 'new concept',
  'add object', 'resize', 'crop', 'change model', 'full redo', 'redo',
]
function classify(text: string): { label: 'minor' | 'major'; confidence: number } {
  const lower = text.toLowerCase()
  const hits = MAJOR_KEYWORDS.filter(k => lower.includes(k)).length
  if (hits >= 2) return { label: 'major', confidence: Math.min(0.97, 0.78 + hits * 0.04) }
  if (hits === 1) return { label: 'major', confidence: 0.72 + Math.random() * 0.12 }
  return { label: 'minor', confidence: 0.86 + Math.random() * 0.11 }
}

// ─── Contract builder ──────────────────────────────────────────────────────
const mockContracts = mockProjects.filter(p => p.status !== 'draft').map(p => ({
  contract_id: `c-${p.project_id}`,
  project_id: p.project_id,
  title: p.title,
  client_name: p.client_name,
  editor_name: p.editor_name,
  project_value: p.project_value,
  status: p.status === 'completed' ? 'closed' : p.status === 'cancelled' ? 'rejected' : 'active',
  scope: `Retouch hingga 20 foto produk; hapus noda; latar putih; koreksi warna untuk ${p.title}`,
  included: 'Penghapusan noda, koreksi warna, penyesuaian white balance, normalisasi bayangan',
  excluded: 'Penggantian subjek, perubahan konsep latar, upscaling AI, compositing 3D',
  allowance_count: 5,
  allowance_consumed: p.status === 'revision' ? 2 : p.status === 'disputed' ? 4 : 1,
  issued_at: p.created_at,
  approved_at: p.started_at,
}))

type Contract = typeof mockContracts[0]
type ClassifyState = 'idle' | 'classifying' | 'done'

// ─── Toast ─────────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

export default function ContractsPage() {
  const [selected, setSelected] = useState<Contract | null>(null)
  const [revisionModal, setRevisionModal] = useState(false)
  const [description, setDescription] = useState('')
  const [classifyState, setClassifyState] = useState<ClassifyState>('idle')
  const [classifyResult, setClassifyResult] = useState<ReturnType<typeof classify> | null>(null)
  const [liveRevisions, setLiveRevisions] = useState<RevisionRequest[]>(mockRevisions)
  const [allowanceMap, setAllowanceMap] = useState<Record<string, number>>(
    Object.fromEntries(mockContracts.map(c => [c.contract_id, c.allowance_consumed]))
  )
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }

  const projectRevisions = selected
    ? liveRevisions.filter(r => r.project_id === selected.project_id)
    : []

  const allowanceConsumed = selected ? (allowanceMap[selected.contract_id] ?? selected.allowance_consumed) : 0

  // ─── Submit revision request ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (!description.trim() || !selected) return
    setClassifyState('classifying')
    setClassifyResult(null)

    await new Promise(r => setTimeout(r, 2200))

    const result = classify(description)
    setClassifyResult(result)
    setClassifyState('done')
  }

  const handleConfirm = () => {
    if (!selected || !classifyResult) return
    const isMajor = classifyResult.label === 'major'

    const newRevision: RevisionRequest = {
      revision_id: `r-${Date.now()}`,
      project_id: selected.project_id,
      request_text: description,
      ai_label: classifyResult.label,
      ai_confidence: classifyResult.confidence,
      status: isMajor ? 'awaiting_topup' : 'accepted',
      price: isMajor ? 350000 : undefined,
      created_at: new Date().toISOString(),
    }

    setLiveRevisions(prev => [newRevision, ...prev])

    if (!isMajor) {
      setAllowanceMap(prev => ({
        ...prev,
        [selected.contract_id]: (prev[selected.contract_id] ?? selected.allowance_consumed) + 1,
      }))
      addToast('Revisi dikirim — diklasifikasi MINOR, gratis.', 'success')
    } else {
      addToast('Revisi diklasifikasi MAJOR — perlu top-up klien sebelum pengerjaan dimulai.', 'info')
    }

    setRevisionModal(false)
    setDescription('')
    setClassifyState('idle')
    setClassifyResult(null)
  }

  const closeModal = () => {
    setRevisionModal(false)
    setDescription('')
    setClassifyState('idle')
    setClassifyResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-card-md text-sm font-medium pointer-events-auto
              ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-navy text-white'}`}>
            {t.message}
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}
              className="ml-1 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-navy/50">{mockContracts.length} kontrak total</p>
        <button className="btn-primary"><FileText className="w-4 h-4" /> Brief Baru</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contract list */}
        <div className="lg:col-span-1 space-y-3">
          {mockContracts.map(c => (
            <button key={c.contract_id} onClick={() => setSelected(c)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.contract_id === c.contract_id ? 'border-navy bg-navy-50 shadow-card-md' : 'bg-white border-border hover:border-navy/20 hover:shadow-card'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-navy leading-tight">{c.title}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-navy/50">{c.client_name} · {c.editor_name}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-navy">{formatCurrency(c.project_value)}</span>
                <span className="text-xs text-navy/40">{formatDate(c.issued_at)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Contract detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="card space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy">{selected.title}</h2>
                  <p className="text-sm text-navy/50 mt-0.5">Kontrak · {formatDate(selected.issued_at)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[['Nilai Proyek', formatCurrency(selected.project_value)],['Editor', selected.editor_name],['Klien', selected.client_name]].map(([l,v]) => (
                  <div key={l} className="bg-primary-200 rounded-xl p-4">
                    <p className="text-xs text-navy/50 mb-1">{l}</p>
                    <p className="font-semibold text-navy text-sm">{v}</p>
                  </div>
                ))}
              </div>

              {/* Revision Envelope */}
              <div>
                <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Revision Envelope
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">Lingkup INCLUDED</span>
                    </div>
                    <p className="text-sm text-emerald-700">{selected.included}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-800">Lingkup EXCLUDED</span>
                    </div>
                    <p className="text-sm text-red-700">{selected.excluded}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">ALLOWANCE (Revisi Gratis)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-amber-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (allowanceConsumed / selected.allowance_count) * 100)}%` }} />
                      </div>
                      <span className={`text-sm font-bold ${allowanceConsumed >= selected.allowance_count ? 'text-red-600' : 'text-amber-800'}`}>
                        {allowanceConsumed} / {selected.allowance_count} terpakai
                      </span>
                    </div>
                    {allowanceConsumed >= selected.allowance_count && (
                      <p className="text-xs text-red-600 mt-2 font-medium">Allowance habis — revisi berikutnya MAJOR (berbayar).</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Revision history */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-navy">Riwayat Revisi
                    {projectRevisions.length > 0 && (
                      <span className="ml-2 text-xs bg-navy text-white px-1.5 py-0.5 rounded-full">{projectRevisions.length}</span>
                    )}
                  </h3>
                  {selected.status === 'active' && (
                    <button onClick={() => setRevisionModal(true)} className="btn-primary text-xs py-1.5 px-3">
                      + Minta Revisi
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {projectRevisions.map(r => (
                    <div key={r.revision_id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        r.ai_label === 'minor' ? 'bg-emerald-50 border-emerald-200' :
                        r.ai_label === 'major' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        r.ai_label === 'minor' ? 'bg-emerald-500' : r.ai_label === 'major' ? 'bg-red-500' : 'bg-amber-400'
                      }`}>
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy">{r.request_text}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className={`text-xs font-bold uppercase tracking-wide ${r.ai_label === 'minor' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {r.ai_label}
                          </span>
                          <span className="text-xs text-navy/40">AI keyakinan {(r.ai_confidence * 100).toFixed(0)}%</span>
                          {r.price ? <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">+{formatCurrency(r.price)}</span> : <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Gratis</span>}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                  {projectRevisions.length === 0 && (
                    <div className="py-8 text-center text-navy/30">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Belum ada revisi. Kirim satu untuk melihat klasifikasi AI bekerja.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64">
              <div className="text-center text-navy/30">
                <FileText className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">Pilih kontrak untuk melihat detail</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revision request modal */}
      <Modal open={revisionModal} onClose={classifyState === 'classifying' ? () => {} : closeModal}
        title="Minta Revisi" size="md">
        <div className="space-y-4">

          {/* Step 1: describe */}
          {classifyState === 'idle' && (
            <>
              <div>
                <label className="label">Jelaskan revisi yang dibutuhkan</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  className="input h-28 resize-none"
                  placeholder="Mis. Semburat warna pada foto #7 perlu disesuaikan, bayangannya terlalu keras…" />
              </div>
              <div className="p-3 bg-navy-50 border border-navy/10 rounded-xl text-sm text-navy/70 flex gap-2">
                <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-navy/40" />
                <div>
                  <p className="font-medium text-navy mb-0.5">AI akan mengklasifikasi ini otomatis</p>
                  <p className="text-xs">MINOR (dalam ALLOWANCE, gratis) atau MAJOR (perubahan lingkup, perlu top-up). Hasil ditampilkan sebelum konfirmasi.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={!description.trim()}
                  className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                  Analisis dengan AI
                </button>
                <button onClick={closeModal} className="btn-secondary">Batal</button>
              </div>
            </>
          )}

          {/* Step 2: classifying */}
          {classifyState === 'classifying' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-navy animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-navy">Menganalisis lingkup revisi…</p>
                <p className="text-sm text-navy/50 mt-1">Membandingkan dengan Revision Envelope</p>
              </div>
            </div>
          )}

          {/* Step 3: result */}
          {classifyState === 'done' && classifyResult && (
            <>
              <div className={`p-4 rounded-xl border-2 ${classifyResult.label === 'minor' ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${classifyResult.label === 'minor' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${classifyResult.label === 'minor' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {classifyResult.label === 'minor' ? 'MINOR — Gratis' : 'MAJOR — Berbayar'}
                    </p>
                    <p className="text-xs text-navy/50">Keyakinan AI: {(classifyResult.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/50 rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full transition-all ${classifyResult.label === 'minor' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${(classifyResult.confidence * 100).toFixed(0)}%` }} />
                </div>
                <p className="text-sm mt-2">
                  {classifyResult.label === 'minor'
                    ? `Revisi ini masih dalam lingkup INCLUDED atau jatah ALLOWANCE Anda. Akan diproses gratis dan mengurangi 1 dari ${selected?.allowance_count} revisi gratis Anda.`
                    : `Revisi ini melebihi lingkup INCLUDED — melibatkan perubahan lingkup yang tidak tercakup kontrak asli. Diperlukan top-up sebesar ${formatCurrency(350000)} sebelum pengerjaan dimulai.`}
                </p>
              </div>

              <div className="bg-primary-200 rounded-xl p-3">
                <p className="text-xs text-navy/50 mb-1 font-medium">Deskripsi revisi Anda</p>
                <p className="text-sm text-navy italic">"{description}"</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handleConfirm} className={`flex-1 justify-center ${classifyResult.label === 'minor' ? 'btn-primary' : 'btn-danger'}`}>
                  {classifyResult.label === 'minor' ? 'Konfirmasi & Kirim' : 'Kirim & Tunggu Top-up'}
                </button>
                <button onClick={() => { setClassifyState('idle'); setClassifyResult(null) }} className="btn-secondary">
                  Tulis Ulang
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
