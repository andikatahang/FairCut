import { UserX, CheckCircle } from 'lucide-react'
import { mockEditors } from '../../data/mockData'

import { StatusBadge } from '../../components/ui/Badge'

const phases = ['Trigger','Project Handoff','Final Payroll','Data Anonymization']

export default function OffboardingPage() {
  return (
    <div className="space-y-6">
      <div className="card max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><UserX className="w-5 h-5 text-red-500"/></div>
          <div><h3 className="font-semibold text-navy">Initiate Offboarding</h3><p className="text-sm text-navy/50">Select an editor and trigger</p></div>
        </div>
        <div className="space-y-3">
          <div><label className="label">Editor</label>
            <select className="input"><option value="">Select editor…</option>{mockEditors.map(e=><option key={e.editor_id}>{e.full_name}</option>)}</select></div>
          <div><label className="label">Trigger reason</label>
            <select className="input"><option>Resignation</option><option>Termination</option><option>Contract end</option></select></div>
          <div><label className="label">Effective date</label><input type="date" className="input"/></div>
          <button className="btn-danger w-full justify-center"><UserX className="w-4 h-4"/>Initiate Offboarding</button>
        </div>
      </div>

      <div className="card max-w-xl">
        <h3 className="font-semibold text-navy mb-4">4-Phase Offboarding Workflow</h3>
        <div className="space-y-3">
          {phases.map((phase, i) => (
            <div key={phase} className="flex items-center gap-4 p-3 bg-primary-200 rounded-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${i < 2 ? 'bg-emerald-500' : 'bg-border'}`}>
                {i < 2 ? <CheckCircle className="w-4 h-4 text-white"/> : <span className="text-xs font-bold text-navy/40">{i+1}</span>}
              </div>
              <div className="flex-1"><p className="text-sm font-medium text-navy">{phase}</p></div>
              <StatusBadge status={i < 2 ? 'completed' : 'pending'}/>
            </div>
          ))}
        </div>
        <p className="text-xs text-navy/40 mt-3">Data anonymization scheduled 90 days post-offboarding per privacy policy.</p>
      </div>
    </div>
  )
}
