import { useState } from 'react'
import { User, FileText, Calendar, Clock } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockPayslips, mockLeaveRequests, mockAttendance } from '../../data/mockData'

export default function ESSPage() {
  const [tab, setTab] = useState<'profile'|'payslips'|'leave'|'attendance'>('profile')
  const myPayslips = mockPayslips.slice(0,2)
  const myLeave = mockLeaveRequests.slice(0,2)

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {[['profile','Profile'],['payslips','Payslips'],['leave','Leave'],['attendance','Attendance']].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===v?'bg-navy text-white':'text-navy/60 hover:text-navy'}`}>{l}</button>
        ))}
      </div>

      {tab==='profile' && (
        <div className="card max-w-lg space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white text-xl font-bold">BS</div>
            <div><h2 className="text-lg font-bold text-navy">Budi Santoso</h2><p className="text-sm text-navy/50">Photo Retouching · Active</p></div>
          </div>
          {[['Full Name','Budi Santoso'],['Email','budi@faircut.id'],['Department','Photo Retouching'],['Specialization','Product Retouch, Color Correction'],['Onboarded','15 Jan 2026'],['Base Salary',formatCurrency(8000000)]].map(([l,v])=>(
            <div key={l} className="flex justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-navy/50">{l}</span>
              <span className="text-sm font-medium text-navy">{v}</span>
            </div>
          ))}
          <button className="btn-secondary w-full justify-center"><User className="w-4 h-4"/>Edit Profile</button>
        </div>
      )}

      {tab==='payslips' && (
        <div className="space-y-4 max-w-2xl">
          {myPayslips.map(ps=>(
            <div key={ps.payslip_id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div><p className="font-semibold text-navy">{formatDate(ps.period_start)} – {formatDate(ps.period_end)}</p></div>
                <StatusBadge status={ps.status}/>
              </div>
              {[['Base Salary',formatCurrency(ps.base_salary),'text-navy'],['Attendance Deduction',`-${formatCurrency(ps.attendance_deduction)}`,'text-red-600'],['Project Bonus',`+${formatCurrency(ps.project_bonus)}`,'text-emerald-600'],['Net Salary',formatCurrency(ps.net_salary),'text-navy font-bold']].map(([l,v,cls])=>(
                <div key={l} className={`flex justify-between py-1.5 border-b border-border last:border-0 text-sm`}><span className="text-navy/60">{l}</span><span className={cls as string}>{v}</span></div>
              ))}
              <button className="btn-secondary mt-3 w-full justify-center text-sm py-2"><FileText className="w-4 h-4"/>Download PDF</button>
            </div>
          ))}
        </div>
      )}

      {tab==='leave' && (
        <div className="space-y-4 max-w-2xl">
          <button className="btn-primary"><Calendar className="w-4 h-4"/>Request Leave</button>
          {myLeave.map(l=>(
            <div key={l.leave_id} className="card flex items-center justify-between">
              <div><p className="font-medium text-navy capitalize">{l.leave_type}</p><p className="text-sm text-navy/50">{formatDate(l.start_date)} – {formatDate(l.end_date)}</p></div>
              <StatusBadge status={l.status}/>
            </div>
          ))}
        </div>
      )}

      {tab==='attendance' && (
        <div className="card max-w-2xl">
          <h3 className="font-semibold text-navy mb-4">Recent Attendance</h3>
          <div className="space-y-2">
            {mockAttendance.slice(-7).reverse().map(a=>(
              <div key={a.date} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-navy">{formatDate(a.date)}</span>
                <div className="flex items-center gap-3">
                  {a.clock_in && <span className="text-xs text-navy/50 flex items-center gap-1"><Clock className="w-3 h-3"/>In: {a.clock_in}</span>}
                  {a.clock_out && <span className="text-xs text-navy/50 flex items-center gap-1"><Clock className="w-3 h-3"/>Out: {a.clock_out}</span>}
                  <StatusBadge status={a.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
