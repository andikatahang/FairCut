import { Link } from 'react-router-dom'
import {
  Scissors, Shield, FileText, Users, BarChart2, MessageSquare,
  ArrowRight, CheckCircle, Star, ChevronRight,
} from 'lucide-react'

const features = [
  { icon: Users, title: 'Smart Recruitment (ATS + DSS)', desc: 'Structured applicant pipeline with AI-powered department scoring. Objective fit assessment, not guesswork.' },
  { icon: FileText, title: 'Revision Envelope', desc: 'Lock service scope with INCLUDED/EXCLUDED/ALLOWANCE framework. Editors and clients always know the rules.' },
  { icon: Shield, title: 'Dual-Phase Escrow', desc: '50% DP on contract approval, 50% on delivery acceptance. Auto-released to company within 1 hour of completion.' },
  { icon: BarChart2, title: 'Integrated KPI & Payroll', desc: 'Client rating + completion rate + manager assessment → fair performance bands. Bonuses calculated from real data.' },
  { icon: MessageSquare, title: 'In-App Chat + AI Revision Classifier', desc: 'All project communication in one place. AI classifies revisions as minor (free) or major (paid) with 85%+ accuracy.' },
  { icon: Shield, title: 'Objective Dispute Resolution', desc: 'Mediator auto-assigned within 2h. Evidence-backed decisions with immutable audit trail. 48h SLA guaranteed.' },
]

const stats = [
  { value: '11', label: 'Integrated Modules' },
  { value: '6', label: 'User Roles' },
  { value: '48h', label: 'Dispute SLA' },
  { value: '≥85%', label: 'AI Accuracy' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary font-sans">
      {/* Nav */}
      <nav className="sticky top-0 bg-primary/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-navy text-lg">FairCut</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-navy/60 hover:text-navy transition-colors">Features</a>
            <a href="#modules" className="text-sm text-navy/60 hover:text-navy transition-colors">Modules</a>
            <a href="#about" className="text-sm text-navy/60 hover:text-navy transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-navy/70 hover:text-navy transition-colors">Log in</Link>
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Get Started <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-navy-50 text-navy text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <Star className="w-3.5 h-3.5 fill-navy" />
          ERP for Visual Services Companies
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-navy leading-[1.05] tracking-tight mb-6">
          Where Fair Revisions<br />
          <span className="text-navy/40">Meet Fair Pay.</span>
        </h1>
        <p className="text-lg text-navy/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          FairCut unifies HR management and service delivery for photo retouching, video editing, and color grading companies. Scope certainty, secure payments, objective dispute resolution.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/login" className="btn-primary text-base py-3 px-7">
            Launch App <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="btn-secondary text-base py-3 px-7">
            See Features <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {stats.map(s => (
            <div key={s.label} className="card text-center py-6">
              <p className="text-3xl font-extrabold text-navy">{s.value}</p>
              <p className="text-sm text-navy/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Everything your visual studio needs</h2>
            <p className="text-navy/60 text-lg max-w-xl mx-auto">From recruitment to offboarding, every workflow is connected and automated.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl border border-border hover:border-navy/20 hover:shadow-card-md transition-all duration-200">
                <div className="w-11 h-11 bg-navy-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy group-hover:scale-110 transition-all duration-200">
                  <Icon className="w-5 h-5 text-navy group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-navy mb-2">{title}</h3>
                <p className="text-sm text-navy/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles section */}
      <section id="modules" className="py-24 bg-primary">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Built for every role</h2>
            <p className="text-navy/60 text-lg max-w-xl mx-auto">Each user sees exactly what they need.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { role: 'Superadmin', points: ['Full platform control', 'Recruitment pipeline', 'Payroll & HR ops', 'Revenue reporting'] },
              { role: 'Editor', points: ['View assigned projects', 'Submit deliverables', 'ESS: leave & payslips', 'Track KPI & bonuses'] },
              { role: 'Client', points: ['Search & book editors', 'Approve briefs & scopes', 'Track revision status', 'Secure escrow payments'] },
              { role: 'Mediator', points: ['Review dispute evidence', 'AI change detection data', 'Issue binding decisions', 'Immutable resolution log'] },
              { role: 'Admin Manager', points: ['Approve leave requests', 'Rate editor performance', 'Monitor attendance', 'Manage team KPIs'] },
              { role: 'Finance', points: ['Escrow reconciliation', 'Revenue recognition', 'Payroll processing', 'IFRS 15 compliance'] },
            ].map(({ role, points }) => (
              <div key={role} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{role[0]}</span>
                  </div>
                  <h3 className="font-semibold text-navy">{role}</h3>
                </div>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-navy/70">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to bring order to your studio?</h2>
          <p className="text-white/60 text-lg mb-8">Launch the demo and explore all 11 modules with full mock data.</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-white text-navy font-semibold px-8 py-4 rounded-xl hover:bg-primary-200 transition-colors text-base">
            Launch FairCut Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-navy/95 py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-navy" />
            </div>
            <span className="text-white font-bold">FairCut</span>
          </div>
          <p className="text-white/40 text-sm text-center">
            Kelompok 5 · Universitas Islam Indonesia · ISD Project v2.2
          </p>
          <p className="text-white/40 text-sm">© 2026 FairCut</p>
        </div>
      </footer>
    </div>
  )
}
