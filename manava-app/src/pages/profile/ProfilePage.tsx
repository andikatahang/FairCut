import { useState } from 'react'
import { User, Star, TrendingUp, Briefcase } from 'lucide-react'
import { StatusBadge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, formatDate } from '../../lib/utils'
import { mockEditorMetrics } from '../../data/mockData'
import { MY_EDITOR } from '../../data/myEditor'

export default function ProfilePage() {
  const [editModal, setEditModal] = useState(false)
  const myMetrics = mockEditorMetrics.find(e => e.editor_id === MY_EDITOR.editor_id)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Identity card */}
        <div className="card text-center">
          <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {MY_EDITOR.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <h2 className="text-lg font-bold text-navy">{MY_EDITOR.full_name}</h2>
          <p className="text-sm text-navy/50 mt-0.5">{MY_EDITOR.department}</p>
          <StatusBadge status={MY_EDITOR.status} />
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {MY_EDITOR.specialization.map(s => (
              <span key={s} className="text-xs bg-navy-50 text-navy px-2.5 py-1 rounded-full font-medium">{s}</span>
            ))}
          </div>
          <button onClick={() => setEditModal(true)} className="btn-secondary w-full justify-center mt-4 text-sm py-2">
            <User className="w-3.5 h-3.5" /> Edit Profil
          </button>
        </div>

        {/* Details */}
        <div className="card lg:col-span-2">
          <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-4">Informasi Pribadi</p>
          <div className="grid sm:grid-cols-2 gap-0">
            {[
              ['Nama Lengkap', MY_EDITOR.full_name],
              ['Email', MY_EDITOR.email],
              ['Telepon', MY_EDITOR.phone],
              ['Departemen', MY_EDITOR.department],
              ['Bergabung', formatDate(MY_EDITOR.onboarded_at)],
              ['Gaji Pokok', formatCurrency(MY_EDITOR.base_salary)],
              ['Alamat', MY_EDITOR.address],
              ['Kontak Darurat', MY_EDITOR.emergency_contact],
            ].map(([label, value]) => (
              <div key={label} className="py-3 border-b border-border last:border-0 sm:odd:pr-6">
                <p className="text-xs text-navy/40 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-navy">{value}</p>
              </div>
            ))}
          </div>

          {/* Quick KPI snapshot */}
          {myMetrics && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-navy/50 uppercase tracking-wider mb-3">Ringkasan KPI Saya</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-navy">{myMetrics.avg_client_rating.toFixed(1)}</p>
                  <p className="text-xs text-navy/50">Rating Klien</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-base font-bold text-navy">{myMetrics.completion_rate}%</p>
                  <p className="text-xs text-navy/50">Penyelesaian</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <Briefcase className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-base font-bold text-navy">{myMetrics.kpi_average.toFixed(2)}</p>
                  <p className="text-xs text-navy/50">Skor KPI</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Profil" size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            ['Nama Lengkap', 'full_name', MY_EDITOR.full_name],
            ['Email', 'email', MY_EDITOR.email],
            ['Telepon', 'phone', MY_EDITOR.phone],
            ['Alamat', 'address', MY_EDITOR.address],
            ['Kontak Darurat', 'emergency_contact', MY_EDITOR.emergency_contact],
          ].map(([label, , value]) => (
            <div key={label} className={label === 'Alamat' || label === 'Kontak Darurat' ? 'sm:col-span-2' : ''}>
              <label className="label">{label}</label>
              <input defaultValue={value} className="input" />
            </div>
          ))}
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button onClick={() => setEditModal(false)} className="btn-secondary">Batal</button>
            <button onClick={() => setEditModal(false)} className="btn-primary">Simpan Perubahan</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
