import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { mockEditors } from '../../data/mockData'
import { EditorCard } from './EditorCard'

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
        <h1 className="text-[20px] font-bold text-[#1b1b1b] tracking-tight">Cari Editor</h1>
        <p className="text-[13px] text-[#999] mt-1">
          {activeEditors.length} profesional terverifikasi tersedia
        </p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c0c0c0]" />
          <input
            type="text"
            placeholder="Cari nama atau departemen..."
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
            <option value="rating">Rating Tertinggi</option>
            <option value="completion">Penyelesaian Terbaik</option>
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
          Semua Keahlian
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
        Menampilkan <span className="font-semibold text-[#1b1b1b]">{filtered.length}</span>{' '}
        editor
      </p>

      {/* Grid or empty */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Search className="w-10 h-10 text-[#d0d0d0] mb-3" />
          <p className="text-[14px] font-medium text-[#888]">Tidak ada editor yang cocok</p>
          <p className="text-[13px] text-[#bbb] mt-1">Coba ubah filter Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(editor => (
            <EditorCard
              key={editor.editor_id}
              editor={editor}
              reviewCount={REVIEW_COUNTS[editor.editor_id] ?? 40}
            />
          ))}
        </div>
      )}

    </div>
  )
}
