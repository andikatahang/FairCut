import { useState } from 'react'
import { Search, Star, ChevronDown } from 'lucide-react'
import { mockEditors } from '../../data/mockData'
import type { Editor } from '../../types'

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

const REVIEW_COUNTS: Record<string, number> = {
  e1: 142, e2: 89, e3: 56, e4: 203, e5: 31,
}

const COMPLETED_PROJECTS: Record<string, number> = {
  e1: 47, e2: 38, e3: 23, e4: 61, e5: 12,
}

function completionTextColor(rate: number): string {
  if (rate >= 90) return 'text-[#16a34a]'
  if (rate >= 75) return 'text-[#ca8a04]'
  return 'text-[#dc2626]'
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function EditorCard({ editor }: { editor: Editor }) {
  const initials = getInitials(editor.full_name)
  const reviewCount = REVIEW_COUNTS[editor.editor_id] ?? 40
  const completedCount = COMPLETED_PROJECTS[editor.editor_id] ?? 20
  const isTopRated = editor.rating >= 4.7 && editor.completion_rate >= 90

  return (
    <article className="bg-white border border-[#e8e8e8] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#021526]/25 hover:shadow-[0_4px_16px_rgba(2,21,38,0.07)] transition-all duration-200">

      {/* Avatar + name row */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#021526] flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0 tracking-wide">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#1b1b1b] text-[15px] leading-snug">{editor.full_name}</h3>
            {isTopRated && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded-full whitespace-nowrap">
                Top Rated
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#999] mt-0.5">{editor.department}</p>
        </div>
      </div>

      {/* Specialization */}
      <div className="flex flex-wrap gap-1.5">
        {editor.specialization.slice(0, 2).map(spec => (
          <span key={spec} className="text-[12px] px-2.5 py-1 rounded-md bg-[#f2f2f2] text-[#555] font-medium">
            {SPEC_LABELS[spec] ?? spec}
          </span>
        ))}
        {editor.specialization.length > 2 && (
          <span className="text-[12px] px-2.5 py-1 rounded-md bg-[#f2f2f2] text-[#999]">
            +{editor.specialization.length - 2}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[13px]">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-[#ca8a04] fill-[#ca8a04]" />
          <span className="font-bold text-[#1b1b1b]">{editor.rating.toFixed(1)}</span>
          <span className="text-[#bbb]">({reviewCount})</span>
        </div>
        <span className="text-[#e0e0e0]">·</span>
        <div>
          <span className={`font-bold ${completionTextColor(editor.completion_rate)}`}>
            {editor.completion_rate}%
          </span>
          <span className="text-[#bbb] ml-1">done</span>
        </div>
        <span className="text-[#e0e0e0]">·</span>
        <span className="text-[#bbb]">{completedCount} jobs</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="flex-1 py-2 rounded-lg border border-[#e0e0e0] text-[13px] font-medium text-[#555] hover:border-[#021526]/40 hover:text-[#1b1b1b] transition-all duration-150"
        >
          View Profile
        </button>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          className="flex-1 py-2 rounded-lg bg-[#021526] text-white text-[13px] font-semibold hover:bg-[#032b4a] transition-colors duration-150"
        >
          Book Now
        </button>
      </div>
    </article>
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

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Page header */}
      <div>
        <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">Find an Editor</h1>
        <p className="text-[13px] text-[#999] mt-1">
          {activeEditors.length} verified professionals available
        </p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c0c0c0]" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-[14px] border border-[#e0e0e0] rounded-xl bg-white text-[#1b1b1b] placeholder:text-[#c0c0c0] focus:outline-none focus:border-[#021526]/40 focus:ring-2 focus:ring-[#021526]/8 transition-all"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as 'rating' | 'completion')}
            className="appearance-none pl-4 pr-9 py-2.5 text-[14px] border border-[#e0e0e0] rounded-xl bg-white text-[#1b1b1b] font-medium focus:outline-none focus:border-[#021526]/40 cursor-pointer"
          >
            <option value="rating">Highest Rated</option>
            <option value="completion">Best Completion</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c0c0c0] pointer-events-none" />
        </div>
      </div>

      {/* Skill filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSpecFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
            specFilter === 'all'
              ? 'bg-[#021526] text-white'
              : 'bg-[#f2f2f2] text-[#555] hover:bg-[#e8e8e8]'
          }`}
        >
          All Skills
        </button>
        {allSpecs.map(spec => (
          <button
            key={spec}
            onClick={() => setSpecFilter(specFilter === spec ? 'all' : spec)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
              specFilter === spec
                ? 'bg-[#021526] text-white'
                : 'bg-[#f2f2f2] text-[#555] hover:bg-[#e8e8e8]'
            }`}
          >
            {SPEC_LABELS[spec] ?? spec}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-[13px] text-[#bbb]">
        Showing <span className="font-semibold text-[#1b1b1b]">{filtered.length}</span>{' '}
        editor{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid or empty */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Search className="w-10 h-10 text-[#d0d0d0] mb-3" />
          <p className="text-[14px] font-medium text-[#888]">No editors match your search</p>
          <p className="text-[13px] text-[#bbb] mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(editor => (
            <EditorCard key={editor.editor_id} editor={editor} />
          ))}
        </div>
      )}

    </div>
  )
}
