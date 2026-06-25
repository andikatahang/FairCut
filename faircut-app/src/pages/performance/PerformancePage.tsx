import { Star, TrendingUp, Target } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { mockEditorMetrics } from '../../data/mockData'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

export default function PerformancePage() {
  const selected2 = mockEditorMetrics[0]

  const radarData = [
    { metric: 'Client Rating', value: (selected2.avg_client_rating / 5) * 100 },
    { metric: 'Completion Rate', value: selected2.completion_rate },
    { metric: 'Manager Rating', value: (selected2.manager_rating / 5) * 100 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-3xl font-bold text-emerald-600">{mockEditorMetrics.filter(e=>e.performance_band==='excellent').length}</p><p className="text-sm text-navy/60 mt-1">Excellent</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-blue-600">{mockEditorMetrics.filter(e=>e.performance_band==='good').length}</p><p className="text-sm text-navy/60 mt-1">Good</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-red-600">{mockEditorMetrics.filter(e=>e.performance_band==='needs_improvement').length}</p><p className="text-sm text-navy/60 mt-1">Needs Improvement</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-navy mb-4">Editor KPI Rankings</h3>
          <div className="space-y-3">
            {[...mockEditorMetrics].sort((a,b)=>b.kpi_average-a.kpi_average).map((e,i)=>(
              <div key={e.editor_id} className="flex items-center gap-4 p-3 bg-primary-200 rounded-xl">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i===0?'bg-amber-400 text-white':i===1?'bg-gray-300 text-gray-700':i===2?'bg-amber-600 text-white':'bg-navy/10 text-navy/60'}`}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-navy">{e.editor_name}</p>
                    <span className="text-sm font-bold text-navy">{e.kpi_average.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-1.5">
                    <div className="bg-navy h-1.5 rounded-full transition-all" style={{width:`${(e.kpi_average/5)*100}%`}}/>
                  </div>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-navy/50 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400"/>{e.avg_client_rating.toFixed(1)}</span>
                    <span className="text-xs text-navy/50 flex items-center gap-1"><TrendingUp className="w-3 h-3"/>{e.completion_rate}%</span>
                    <span className="text-xs text-navy/50 flex items-center gap-1"><Target className="w-3 h-3"/>{e.manager_rating.toFixed(1)}</span>
                  </div>
                </div>
                <StatusBadge status={e.performance_band}/>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy mb-1">{selected2.editor_name}</h3>
          <p className="text-xs text-navy/50 mb-4">KPI Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E8EDF2"/>
              <PolarAngleAxis dataKey="metric" tick={{fontSize:11, fill:'#022E5799'}}/>
              <Radar dataKey="value" stroke="#022E57" fill="#022E57" fillOpacity={0.15} strokeWidth={2}/>
              <Tooltip formatter={(v)=>[`${Number(v).toFixed(1)}%`]}/>
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-sm"><span className="text-navy/60">Client Rating</span><span className="font-medium">{selected2.avg_client_rating.toFixed(1)} / 5.0</span></div>
            <div className="flex justify-between text-sm"><span className="text-navy/60">Completion Rate</span><span className="font-medium">{selected2.completion_rate}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-navy/60">Manager Rating</span><span className="font-medium">{selected2.manager_rating.toFixed(1)} / 5.0</span></div>
            <div className="flex justify-between text-sm border-t border-border pt-2 mt-2"><span className="font-semibold text-navy">KPI Average</span><span className="font-bold text-navy">{selected2.kpi_average.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
