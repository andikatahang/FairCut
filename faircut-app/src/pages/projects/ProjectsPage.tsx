import { useState } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockProjects } from '../../data/mockData'
import type { ProjectStatus } from '../../types'

const ALL_STATUSES: ProjectStatus[] = ['in_progress','in_review','revision','disputed','completed','cancelled','awaiting_dp']

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const filtered = filter === 'all' ? mockProjects : mockProjects.filter(p => p.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter==='all'?'bg-navy text-white border-navy':'bg-white text-navy/60 border-border hover:border-navy/30'}`}>All ({mockProjects.length})</button>
          {ALL_STATUSES.map(s => {
            const count = mockProjects.filter(p=>p.status===s).length
            if (!count) return null
            return (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter===s?'bg-navy text-white border-navy':'bg-white text-navy/60 border-border hover:border-navy/30'}`}>
                {s.replace(/_/g,' ')} ({count})
              </button>
            )
          })}
        </div>
        <button className="btn-primary"><Plus className="w-4 h-4"/>New Project</button>
      </div>

      <div className="card p-0 overflow-hidden"><div className="overflow-x-auto">
        <table className="table">
          <thead><tr><th>Project</th><th>Client</th><th>Editor</th><th>Value</th><th>Status</th><th>Started</th></tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-navy/30"><Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40"/>No projects found</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.project_id} className="cursor-pointer">
                <td>
                  <p className="font-medium text-navy">{p.title}</p>
                  <p className="text-xs text-navy/50 mt-0.5 max-w-xs truncate">{p.description}</p>
                </td>
                <td className="text-navy/70">{p.client_name}</td>
                <td className="text-navy/70">{p.editor_name}</td>
                <td className="font-medium text-navy">{formatCurrency(p.project_value)}</td>
                <td><StatusBadge status={p.status}/></td>
                <td className="text-navy/50 text-sm">{p.started_at ? formatDate(p.started_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  )
}
