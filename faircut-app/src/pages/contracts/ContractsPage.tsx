import { useState } from 'react'
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockProjects, mockRevisions } from '../../data/mockData'

const mockContracts = mockProjects.filter(p => p.status !== 'draft').map(p => ({
  contract_id: `c-${p.project_id}`,
  project_id: p.project_id,
  title: p.title,
  client_name: p.client_name,
  editor_name: p.editor_name,
  project_value: p.project_value,
  status: p.status === 'completed' ? 'closed' : p.status === 'cancelled' ? 'rejected' : 'active',
  scope: `Retouch up to 20 product photos; remove blemishes; white background; color correction for ${p.title}`,
  included: 'Blemish removal, color correction, white balance adjustment, shadow normalization',
  excluded: 'Subject replacement, background concept change, AI upscaling, 3D compositing',
  allowance_count: 5,
  allowance_consumed: p.status === 'revision' ? 2 : p.status === 'disputed' ? 4 : 1,
  issued_at: p.created_at,
  approved_at: p.started_at,
}))

export default function ContractsPage() {
  const [selected, setSelected] = useState<typeof mockContracts[0] | null>(null)
  const [revisionModal, setRevisionModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy/50">{mockContracts.length} contracts total</p>
        <button className="btn-primary"><FileText className="w-4 h-4" /> New Brief</button>
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
                  <p className="text-sm text-navy/50 mt-0.5">Contract · {formatDate(selected.issued_at)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-primary-200 rounded-xl p-4">
                  <p className="text-xs text-navy/50 mb-1">Project Value</p>
                  <p className="font-bold text-navy">{formatCurrency(selected.project_value)}</p>
                </div>
                <div className="bg-primary-200 rounded-xl p-4">
                  <p className="text-xs text-navy/50 mb-1">Editor</p>
                  <p className="font-semibold text-navy text-sm">{selected.editor_name}</p>
                </div>
                <div className="bg-primary-200 rounded-xl p-4">
                  <p className="text-xs text-navy/50 mb-1">Client</p>
                  <p className="font-semibold text-navy text-sm">{selected.client_name}</p>
                </div>
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
                      <span className="text-sm font-semibold text-emerald-800">INCLUDED Scope</span>
                    </div>
                    <p className="text-sm text-emerald-700">{selected.included}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-800">EXCLUDED Scope</span>
                    </div>
                    <p className="text-sm text-red-700">{selected.excluded}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">ALLOWANCE (Free Revisions)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-amber-200 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(selected.allowance_consumed / selected.allowance_count) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-amber-800">{selected.allowance_consumed} / {selected.allowance_count} used</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revisions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-navy">Revision History</h3>
                  <button onClick={() => setRevisionModal(true)} className="btn-ghost text-xs py-1.5">+ Request Revision</button>
                </div>
                <div className="space-y-2">
                  {mockRevisions.filter(r => r.project_id === selected.project_id).map(r => (
                    <div key={r.revision_id} className="flex items-start gap-3 p-3 bg-primary-200 rounded-xl">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${r.ai_label === 'minor' ? 'bg-emerald-100' : r.ai_label === 'major' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <span className="text-xs font-bold">{r.ai_label === 'minor' ? 'M' : r.ai_label === 'major' ? 'X' : '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy">{r.request_text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={r.ai_label} />
                          <span className="text-xs text-navy/40">AI: {(r.ai_confidence * 100).toFixed(0)}% confidence</span>
                          {r.price ? <span className="text-xs font-medium text-red-600">+{formatCurrency(r.price)}</span> : null}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                  {mockRevisions.filter(r => r.project_id === selected.project_id).length === 0 && (
                    <p className="text-sm text-navy/40 py-3 text-center">No revisions yet</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64">
              <div className="text-center text-navy/30">
                <FileText className="w-10 h-10 mx-auto mb-3" />
                <p className="text-sm">Select a contract to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={revisionModal} onClose={() => setRevisionModal(false)} title="Request Revision" size="md">
        <div className="space-y-4">
          <div><label className="label">Describe the revision needed</label>
            <textarea className="input h-28 resize-none" placeholder="E.g. The color cast on photo #7 needs adjustment…" /></div>
          <div className="p-3 bg-navy-50 rounded-xl text-sm text-navy/70">
            <p className="font-medium mb-1">AI Classification</p>
            <p>The AI will automatically classify this revision as MINOR (free) or MAJOR (paid) based on your Revision Envelope.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex-1 justify-center">Submit Revision Request</button>
            <button className="btn-secondary" onClick={() => setRevisionModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
