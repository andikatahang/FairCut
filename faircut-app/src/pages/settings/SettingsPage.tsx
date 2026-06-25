import { Settings } from 'lucide-react'
export default function SettingsPage() {
  return (
    <div className="card max-w-lg">
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-navy"/></div><h2 className="font-semibold text-navy">Platform Settings</h2></div>
      <div className="space-y-4">
        {[['Company Name','FairCut Visual Services'],['Default ALLOWANCE','3 free revisions'],['Top-up Timeout','72 hours'],['Mediator SLA','48 hours'],['Escrow Release SLA','1 hour'],['Data Retention (Finance)','7 years'],['Data Anonymization','90 days post-offboarding']].map(([l,v])=>(
          <div key={l} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
            <span className="text-navy/60">{l}</span><span className="font-medium text-navy">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
