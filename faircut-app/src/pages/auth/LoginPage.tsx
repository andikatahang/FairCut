import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Eye, EyeOff, ArrowRight } from 'lucide-react'
import type { UserRole } from '../../types'

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'superadmin',    label: 'Superadmin',     desc: 'Full platform control' },
  { value: 'editor',        label: 'Editor',          desc: 'Manage projects & HR' },
  { value: 'client',        label: 'Client',          desc: 'Book & track services' },
  { value: 'mediator',      label: 'Mediator',        desc: 'Resolve disputes' },
  { value: 'admin_manager', label: 'Admin Manager',   desc: 'Team & leave approval' },
  { value: 'finance',       label: 'Finance',         desc: 'Escrow & payroll' },
]

interface LoginPageProps { onLogin: (role: UserRole) => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('superadmin')
  const [email, setEmail] = useState('admin@faircut.id')

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-navy p-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-navy" />
          </div>
          <span className="text-white font-bold text-xl">FairCut</span>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Fair revisions.<br />Fair pay.<br />Fair outcomes.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            The integrated ERP that connects HR, service delivery, and finance for professional visual services companies.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['11', 'Modules'], ['6', 'User roles'], ['≥85%', 'AI accuracy'], ['48h', 'Dispute SLA']].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-xl p-4">
              <p className="text-white text-2xl font-bold">{v}</p>
              <p className="text-white/50 text-sm">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-navy font-bold text-xl">FairCut</span>
          </div>

          <h1 className="text-3xl font-bold text-navy mb-1">Welcome back</h1>
          <p className="text-navy/50 text-sm mb-8">Sign in to your account</p>

          <div className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@faircut.id" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-11" defaultValue="••••••••" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="label">Demo role</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 ${selectedRole === r.value ? 'border-navy bg-navy-50' : 'border-border bg-white hover:border-navy/30'}`}
                  >
                    <p className={`text-sm font-medium ${selectedRole === r.value ? 'text-navy' : 'text-navy/80'}`}>{r.label}</p>
                    <p className="text-xs text-navy/40 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => onLogin(selectedRole)} className="btn-primary w-full justify-center py-3 text-base mt-2">
              Sign in as {roles.find(r => r.value === selectedRole)?.label} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-sm text-navy/50 mt-6">
            Don't have an account?{' '}
            <Link to="/login" className="text-navy font-medium hover:underline">Apply as Editor</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
