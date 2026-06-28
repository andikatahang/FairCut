import { useState } from 'react'
import { Star, TrendingUp, Target, Award, ChevronUp, ChevronDown, Minus, Users } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { mockEditorMetrics, mockKpiHistory } from '../../data/mockData'
import type { EditorMetrics, UserRole } from '../../types'

const BAND_META: Record<string, { color: string; bg: string; label: string }> = {
  excellent:        { color: 'text-emerald-700', bg: 'bg-emerald-50',  label: 'Sangat Baik' },
  good:             { color: 'text-blue-700',    bg: 'bg-blue-50',     label: 'Baik' },
  needs_improvement:{ color: 'text-red-700',     bg: 'bg-red-50',      label: 'Perlu Peningkatan' },
}

const RANK_BADGE = ['bg-amber-400 text-white', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-white']

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="ml-1 text-sm font-semibold text-navy">{value.toFixed(1)}</span>
    </div>
  )
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous
  if (delta > 0.05) return <ChevronUp className="w-4 h-4 text-emerald-500" />
  if (delta < -0.05) return <ChevronDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-navy/30" />
}

function KpiGauge({ value }: { value: number }) {
  const pct = (value / 5) * 100
  const color = value >= 4.5 ? '#10b981' : value >= 3.5 ? '#3b82f6' : '#ef4444'
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e8edf2" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-navy">{value.toFixed(1)}</span>
        <span className="text-xs text-navy/40">/ 5.0</span>
      </div>
    </div>
  )
}

export default function PerformancePage({ role }: { role: UserRole }) {
  const isManager = role === 'superadmin' || role === 'admin_manager'
  const sorted = [...mockEditorMetrics].sort((a, b) => b.kpi_average - a.kpi_average)

  // For editor role, show only their own entry (hardcoded to e1 for demo)
  const myMetrics = mockEditorMetrics.find(e => e.editor_id === 'e1') ?? mockEditorMetrics[0]
  const [selected, setSelected] = useState<EditorMetrics>(isManager ? sorted[0] : myMetrics)
  const [ratingModal, setRatingModal] = useState(false)
  const [draftRating, setDraftRating] = useState(selected.manager_rating)
  const [ratingNote, setRatingNote] = useState('')

  const history = mockKpiHistory.filter(h => h.editor_id === selected.editor_id)
  const prevSnapshot = history[history.length - 2]

  const radarData = [
    { metric: 'Rating Klien', value: (selected.avg_client_rating / 5) * 100 },
    { metric: 'Tingkat Penyelesaian', value: selected.completion_rate },
    { metric: 'Rating Manajer', value: (selected.manager_rating / 5) * 100 },
  ]

  const trendData = history.map(h => ({
    quarter: h.quarter,
    KPI: h.kpi_average,
    'Rating Klien': h.avg_client_rating,
    '% Penyelesaian': +(h.completion_rate / 20).toFixed(2), // scale to 0–5
  }))

  const bandMeta = BAND_META[selected.performance_band] ?? BAND_META.good

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-emerald-600">{mockEditorMetrics.filter(e => e.performance_band === 'excellent').length}</p>
          <p className="text-xs text-navy/60 mt-0.5">Sangat Baik</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-blue-600">{mockEditorMetrics.filter(e => e.performance_band === 'good').length}</p>
          <p className="text-xs text-navy/60 mt-0.5">Baik</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-red-600">{mockEditorMetrics.filter(e => e.performance_band === 'needs_improvement').length}</p>
          <p className="text-xs text-navy/60 mt-0.5">Perlu Peningkatan</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: rankings list (manager) or single-card (editor) */}
        {isManager ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider px-1 mb-3">
              <Users className="w-3.5 h-3.5 inline mr-1" />Peringkat — Q2 2026
            </p>
            {sorted.map((e, i) => (
              <button
                key={e.editor_id}
                onClick={() => { setSelected(e); setDraftRating(e.manager_rating) }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected.editor_id === e.editor_id ? 'border-navy bg-navy-50' : 'bg-white border-border hover:border-navy/20'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_BADGE[i] ?? 'bg-navy/10 text-navy/60'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-navy truncate">{e.editor_name}</p>
                      <span className="text-sm font-bold text-navy shrink-0">{e.kpi_average.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                      <div className="bg-navy h-1 rounded-full" style={{ width: `${(e.kpi_average / 5) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2 text-xs text-navy/50">
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" />{e.avg_client_rating.toFixed(1)}</span>
                        <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{e.completion_rate}%</span>
                        <span className="flex items-center gap-0.5"><Target className="w-3 h-3" />{e.manager_rating.toFixed(1)}</span>
                      </div>
                      <StatusBadge status={e.performance_band} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card text-center">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Skor KPI Anda</p>
              <KpiGauge value={selected.kpi_average} />
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 ${bandMeta.bg} ${bandMeta.color}`}>
                <Award className="w-3.5 h-3.5" /> {bandMeta.label}
              </div>
            </div>
            <div className="card space-y-3">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider">Rincian Skor</p>
              {[
                { label: 'Rating Klien', value: selected.avg_client_rating, max: 5, icon: Star },
                { label: 'Tingkat Penyelesaian', value: selected.completion_rate / 20, max: 5, icon: TrendingUp, raw: `${selected.completion_rate}%` },
                { label: 'Rating Manajer', value: selected.manager_rating, max: 5, icon: Target },
              ].map(({ label, value, icon: Icon, raw }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="flex items-center gap-1.5 text-sm text-navy/60"><Icon className="w-3.5 h-3.5" />{label}</span>
                  <span className="text-sm font-semibold text-navy">{raw ?? `${value.toFixed(1)} / 5.0`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: detail panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white text-sm font-bold">
                    {selected.editor_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-navy">{selected.editor_name}</h2>
                    <p className="text-xs text-navy/50">Tinjauan Q2 2026</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {prevSnapshot && (
                  <div className="flex items-center gap-1 text-sm text-navy/50">
                    <TrendIcon current={selected.kpi_average} previous={prevSnapshot.kpi_average} />
                    <span className="text-xs">vs Q1 2026</span>
                  </div>
                )}
                <KpiGauge value={selected.kpi_average} />
                {isManager && (
                  <button onClick={() => setRatingModal(true)} className="btn-secondary text-sm py-2">
                    <Target className="w-3.5 h-3.5" /> Nilai
                  </button>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Rating Klien', value: selected.avg_client_rating, prev: prevSnapshot?.avg_client_rating, icon: Star, color: 'text-amber-500', fmt: (v: number) => `${v.toFixed(1)} / 5.0` },
                { label: 'Tingkat Penyelesaian', value: selected.completion_rate, prev: prevSnapshot?.completion_rate, icon: TrendingUp, color: 'text-blue-500', fmt: (v: number) => `${v}%` },
                { label: 'Rating Manajer', value: selected.manager_rating, prev: prevSnapshot?.manager_rating, icon: Target, color: 'text-navy/60', fmt: (v: number) => `${v.toFixed(1)} / 5.0` },
              ].map(({ label, value, prev, icon: Icon, color, fmt }) => (
                <div key={label} className="bg-navy-50/50 rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-base font-bold text-navy">{fmt(value)}</p>
                  <p className="text-xs text-navy/50 mt-0.5">{label}</p>
                  {prev !== undefined && (
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      <TrendIcon current={value} previous={prev} />
                      <span className="text-xs text-navy/40">{prev < value ? '+' : ''}{(value - prev).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Radar */}
            <div className="card">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Dimensi KPI</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <PolarGrid stroke="#e8edf2" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#022E5799' }} />
                  <Radar dataKey="value" stroke="#022E57" fill="#022E57" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`]} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-navy/50">
                  <span>Rating Klien</span><span className="font-semibold text-navy">{selected.avg_client_rating.toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between text-xs text-navy/50">
                  <span>Tingkat Penyelesaian</span><span className="font-semibold text-navy">{selected.completion_rate}%</span>
                </div>
                <div className="flex justify-between text-xs text-navy/50">
                  <span>Rating Manajer</span><span className="font-semibold text-navy">{selected.manager_rating.toFixed(1)}/5</span>
                </div>
              </div>
            </div>

            {/* KPI trend */}
            <div className="card">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Tren KPI (4 Kuartal)</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#022E5799' }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#022E5799' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="KPI" stroke="#022E57" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Rating Klien" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client rating stars visual */}
          <div className="card">
            <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-4">Kepuasan Klien</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-navy">{selected.avg_client_rating.toFixed(1)}</p>
                <StarRating value={selected.avg_client_rating} />
                <p className="text-xs text-navy/40 mt-1">Rata-rata semua proyek</p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const frac = star === Math.round(selected.avg_client_rating) ? 0.55
                    : star === Math.round(selected.avg_client_rating) + 1 ? 0.25
                    : star === Math.round(selected.avg_client_rating) - 1 ? 0.15
                    : 0.03
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-navy/50 w-4">{star}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${frac * 100}%` }} />
                      </div>
                      <span className="text-xs text-navy/40 w-8 text-right">{Math.round(frac * 100)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Manajer Modal */}
      <Modal open={ratingModal} onClose={() => setRatingModal(false)} title={`Rate ${selected.editor_name}`}>
        <div className="space-y-4">
          <p className="text-sm text-navy/60">Kirim rating manajer kuartalan untuk editor ini. Berkontribusi 1/3 dari total skor KPI.</p>

          <div>
            <label className="label">Rating Manajer (1,0 – 5,0)</label>
            <input
              type="range" min="1" max="5" step="0.1"
              value={draftRating}
              onChange={e => setDraftRating(Number(e.target.value))}
              className="w-full accent-navy"
            />
            <div className="flex justify-between text-xs text-navy/50 mt-1">
              <span>1,0 — Buruk</span>
              <span className="font-bold text-navy text-sm">{draftRating.toFixed(1)}</span>
              <span>5,0 — Luar Biasa</span>
            </div>
            <div className="flex justify-center mt-2">
              <StarRating value={draftRating} />
            </div>
          </div>

          <div>
            <label className="label">Catatan Tinjauan</label>
            <textarea
              rows={3}
              value={ratingNote}
              onChange={e => setRatingNote(e.target.value)}
              className="input resize-none"
              placeholder="Ringkas sorotan kinerja, area yang perlu ditingkatkan..."
            />
          </div>

          <div className="bg-navy-50/50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-medium text-navy">Proyeksi Dampak KPI</p>
            <div className="flex justify-between text-navy/60 text-xs">
              <span>Rating Klien ({selected.avg_client_rating.toFixed(1)})</span>
              <span>{((selected.avg_client_rating / 5) * 33.3).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-navy/60 text-xs">
              <span>Tingkat Penyelesaian ({selected.completion_rate}%)</span>
              <span>{(selected.completion_rate / 100 * 33.3).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-navy/60 text-xs">
              <span>Rating Manajer ({draftRating.toFixed(1)})</span>
              <span>{((draftRating / 5) * 33.3).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between font-semibold text-navy text-xs border-t border-border pt-1 mt-1">
              <span>Estimasi KPI Baru</span>
              <span>{(((selected.avg_client_rating / 5) + (selected.completion_rate / 100) + (draftRating / 5)) / 3 * 5).toFixed(2)} / 5.0</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setRatingModal(false)} className="btn-secondary">Batal</button>
            <button onClick={() => setRatingModal(false)} className="btn-primary">Kirim Rating</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
