import { useState } from 'react'
import { Search, Star, MessageCircle, User, ChevronDown, Award, CheckCircle } from 'lucide-react'
import { mockEditors } from '../../data/mockData'
import type { Editor } from '../../types'

const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-blue-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
]

const SPEC_LABELS: Record<string, string> = {
  product_retouch: 'Product Retouch',
  color_correction: 'Color Correction',
  video_edit: 'Video Edit',
  color_grading: 'Color Grading',
  portrait_retouch: 'Portrait Retouch',
  background_removal: 'BG Removal',
  vfx: 'VFX',
  motion_graphics: 'Motion Graphics',
}

const SPEC_COLORS: Record<string, string> = {
  product_retouch: 'bg-blue-50 text-blue-700 border border-blue-100',
  color_correction: 'bg-amber-50 text-amber-700 border border-amber-100',
  video_edit: 'bg-purple-50 text-purple-700 border border-purple-100',
  color_grading: 'bg-violet-50 text-violet-700 border border-violet-100',
  portrait_retouch: 'bg-rose-50 text-rose-700 border border-rose-100',
  background_removal: 'bg-teal-50 text-teal-700 border border-teal-100',
  vfx: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  motion_graphics: 'bg-orange-50 text-orange-700 border border-orange-100',
}

const REVIEW_COUNTS: Record<string, number> = {
  e1: 142, e2: 89, e3: 56, e4: 203, e5: 31,
}

const COMPLETED_PROJECTS: Record<string, number> = {
  e1: 47, e2: 38, e3: 23, e4: 61, e5: 12,
}

function getAvatarGradient(name: string): string {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length]
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
          />
        ))}
      </div>
      <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  )
}

function CompletionBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Completion</span>
        <span className={`font-semibold ${rate >= 90 ? 'text-emerald-700' : rate >= 75 ? 'text-amber-700' : 'text-red-600'}`}>{rate}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

function EditorCard({ editor }: { editor: Editor }) {
  const initials = getInitials(editor.full_name)
  const gradient = getAvatarGradient(editor.full_name)
  const reviewCount = REVIEW_COUNTS[editor.editor_id] ?? 40
  const completedCount = COMPLETED_PROJECTS[editor.editor_id] ?? 20
  const isTopRated = editor.rating >= 4.7 && editor.completion_rate >= 90

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-250 cursor-pointer overflow-hidden flex flex-col">
      {/* Top badge strip */}
      {isTopRated ? (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 py-1.5 text-center">
          <span className="text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-1">
            <Award className="w-3 h-3" /> Top Rated
          </span>
        </div>
      ) : (
        <div className="h-0.5 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-200`}>
            {initials}
            {editor.active_projects > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {editor.active_projects}
              </span>
            )}
          </div>
        </div>

        {/* Name + dept */}
        <div className="text-center mb-3">
          <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{editor.full_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{editor.department}</p>
        </div>

        {/* Specialization tags */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {editor.specialization.slice(0, 2).map(spec => (
            <span key={spec} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${SPEC_COLORS[spec] ?? 'bg-gray-100 text-gray-600'}`}>
              {SPEC_LABELS[spec] ?? spec}
            </span>
          ))}
          {editor.specialization.length > 2 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
              +{editor.specialization.length - 2}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="flex justify-center mb-3">
          <StarRow rating={editor.rating} count={reviewCount} />
        </div>

        {/* Completion rate */}
        <div className="mb-4">
          <CompletionBar rate={editor.completion_rate} />
        </div>

        {/* Completed projects */}
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-4">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>{completedCount} projects completed</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:border-navy hover:text-navy hover:bg-navy/5 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            View Profile
          </button>
          <button
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseEditorsPage() {
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState<string>('all')
  const [sort, setSort] = useState<'rating' | 'completion'>('rating')

  const allSpecs = Array.from(new Set(mockEditors.flatMap(e => e.specialization)))
  const activeEditors = mockEditors.filter(e => e.status === 'active')

  const filtered = activeEditors
    .filter(e => {
      const q = search.toLowerCase()
      if (q && !e.full_name.toLowerCase().includes(q) && !e.department.toLowerCase().includes(q)) return false
      if (specFilter !== 'all' && !e.specialization.includes(specFilter)) return false
      return true
    })
    .sort((a, b) => sort === 'rating' ? b.rating - a.rating : b.completion_rate - a.completion_rate)

  const topRatedCount = activeEditors.filter(e => e.rating >= 4.7 && e.completion_rate >= 90).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Editors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeEditors.length} verified professionals · {topRatedCount} Top Rated
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Active now
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            Top Rated = 4.7+ rating
          </span>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-gray-400 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {/* Sort */}
          <div className="relative shrink-0">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as 'rating' | 'completion')}
              className="appearance-none pl-4 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white text-gray-700 font-medium cursor-pointer"
            >
              <option value="rating">Highest Rated</option>
              <option value="completion">Best Completion</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Specialization filter chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSpecFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${specFilter === 'all' ? 'bg-navy text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Skills
          </button>
          {allSpecs.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecFilter(specFilter === spec ? 'all' : spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${specFilter === spec ? 'bg-navy text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {SPEC_LABELS[spec] ?? spec}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 pl-1">
        Showing <span className="font-semibold text-gray-700">{filtered.length}</span> editor{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <User className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No editors found</p>
          <p className="text-xs mt-1 text-gray-300">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(editor => (
            <EditorCard key={editor.editor_id} editor={editor} />
          ))}
        </div>
      )}
    </div>
  )
}
