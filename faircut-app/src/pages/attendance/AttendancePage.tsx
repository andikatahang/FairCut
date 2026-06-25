import { useState } from 'react'
import { Clock, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockAttendance, mockLeaveRequests, mockPayslips } from '../../data/mockData'

const statusColors: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  leave: 'bg-blue-100 text-blue-700',
}

export default function AttendancePage() {
  const [tab, setTab] = useState<'attendance'|'leave'|'payroll'>('attendance')
  const present = mockAttendance.filter(a => a.status === 'present').length
  const absent = mockAttendance.filter(a => a.status === 'absent').length

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white border border-border rounded-xl p-1 w-fit">
        {[['attendance','Attendance'], ['leave','Leave Requests'], ['payroll','Payroll & Payslips']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===v?'bg-navy text-white':'text-navy/60 hover:text-navy'}`}>{l}</button>
        ))}
      </div>

      {tab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="Days Present" value={present} icon={CheckCircle} accent="bg-emerald-50" />
            <StatCard label="Days Absent" value={absent} icon={XCircle} accent="bg-red-50" />
            <StatCard label="On Leave" value={mockAttendance.filter(a=>a.status==='leave').length} icon={Calendar} accent="bg-blue-50" />
          </div>
          {/* Clock in widget */}
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-navy/50 mb-1">Today — {new Date().toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long'})}</p>
              <p className="text-2xl font-bold text-navy">{new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            <div className="flex gap-3">
              <button className="btn-primary"><Clock className="w-4 h-4" />Clock In</button>
              <button className="btn-secondary"><Clock className="w-4 h-4" />Clock Out</button>
            </div>
          </div>
          {/* Calendar grid */}
          <div className="card">
            <h3 className="font-semibold text-navy mb-4">June 2026 Attendance</h3>
            <div className="grid grid-cols-7 gap-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
                <div key={d} className="text-center text-xs font-medium text-navy/40 py-1">{d}</div>
              ))}
              {Array.from({length:6}).map((_,i)=>( // offset
                <div key={`offset-${i}`} />
              )).slice(0,1)} {/* June starts Monday */}
              {mockAttendance.map(a => {
                const day = new Date(a.date).getDate()
                return (
                  <div key={a.date} className={`rounded-lg p-2 text-center ${statusColors[a.status]}`}>
                    <p className="text-xs font-semibold">{day}</p>
                    {a.clock_in && <p className="text-[10px] opacity-70">{a.clock_in}</p>}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4">
              {Object.entries(statusColors).map(([k,v])=>(
                <div key={k} className="flex items-center gap-1.5 text-xs text-navy/60">
                  <span className={`w-3 h-3 rounded-sm ${v.split(' ')[0]}`}/>
                  {k.charAt(0).toUpperCase()+k.slice(1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary"><Calendar className="w-4 h-4"/>Request Leave</button>
          </div>
          <div className="card p-0 overflow-hidden"><div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Editor</th><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody>
                {mockLeaveRequests.map(l=>(
                  <tr key={l.leave_id}>
                    <td className="font-medium text-navy">{l.editor_name}</td>
                    <td><span className="capitalize">{l.leave_type}</span></td>
                    <td>{formatDate(l.start_date)}</td>
                    <td>{formatDate(l.end_date)}</td>
                    <td><StatusBadge status={l.status}/></td>
                    <td className="text-navy/50">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-4">
          {mockPayslips.map(ps=>(
            <div key={ps.payslip_id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy">{ps.editor_name}</h3>
                  <p className="text-sm text-navy/50">{formatDate(ps.period_start)} – {formatDate(ps.period_end)}</p>
                </div>
                <StatusBadge status={ps.status}/>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-navy/60">Base Salary</span><span className="font-medium text-navy">{formatCurrency(ps.base_salary)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy/60">Attendance Deduction</span><span className="font-medium text-red-600">-{formatCurrency(ps.attendance_deduction)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy/60">Project Bonus</span><span className="font-medium text-emerald-600">+{formatCurrency(ps.project_bonus)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-navy/60">Reimbursement</span><span className="font-medium text-navy">{formatCurrency(ps.reimbursement_total)}</span></div>
                </div>
                <div className="flex items-center justify-center bg-navy rounded-2xl p-6">
                  <div className="text-center">
                    <p className="text-white/60 text-sm mb-1">Net Salary</p>
                    <p className="text-white text-2xl font-bold">{formatCurrency(ps.net_salary)}</p>
                  </div>
                </div>
              </div>
              <button className="btn-secondary w-full justify-center"><FileText className="w-4 h-4"/>Download Payslip PDF</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
