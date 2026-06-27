import { useState, type FC, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import logoDark from '../../assets/logo-dark.png'
import logoLight from '../../assets/logo-light.png'
import {
  Sparkles, ArrowRight, ChevronRight, Check, Plus, Minus,
  Users, FileText, Shield, BarChart2, ScanLine, Scale,
  FileCheck2, PackageCheck, BadgeDollarSign,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────
   Design language extracted from Framer project Manava-SmallERP
   Brand navy #021526 · lime accent #D0F100
   blue glow #0050F8 · muted #596074 · surface #FBFBFB
   Display: Inter Display · Body: Open Runde
   ────────────────────────────────────────────────────────── */

type IconType = FC<SVGProps<SVGSVGElement>>

type Feature = { icon: IconType; title: string; tag: string; desc: string }
type Step = { icon: IconType; step: string; title: string; desc: string }
type Role = { role: string; initial: string; color: string; points: string[] }
type Stat = { value: string; label: string; sub: string }
type Faq = { q: string; a: string }

const features: Feature[] = [
  { icon: FileText, title: 'Revision Envelope', tag: 'Scope Control',
    desc: 'Lock every engagement with an INCLUDED / EXCLUDED / ALLOWANCE framework before a single pixel moves.' },
  { icon: Shield, title: 'Dual-Phase Escrow', tag: 'Secure Payments',
    desc: '50% on contract approval, 50% on delivery acceptance — auto-released within an hour.' },
  { icon: ScanLine, title: 'AI Revision Classifier', tag: '≥85% accuracy',
    desc: 'Change detection classifies each revision as minor (free) or major (paid), with evidence.' },
  { icon: Users, title: 'Smart Recruitment', tag: 'ATS + DSS',
    desc: 'A structured applicant pipeline with objective, AI-assisted department scoring.' },
  { icon: BarChart2, title: 'Integrated KPI & Payroll', tag: 'Performance',
    desc: 'Client rating, completion, and manager assessment roll into fair, data-driven bonuses.' },
  { icon: Scale, title: 'Dispute Resolution', tag: '48h SLA',
    desc: 'A mediator is auto-assigned within two hours. Binding decisions, immutable audit trail.' },
]

const steps: Step[] = [
  { icon: FileCheck2, step: '01', title: 'Book & Lock Scope',
    desc: 'The client books an editor, the Revision Envelope is set, and the brief is signed digitally.' },
  { icon: PackageCheck, step: '02', title: 'Deliver & Classify',
    desc: 'The editor works inside the agreed scope. Each revision is classified — minor or major — automatically.' },
  { icon: BadgeDollarSign, step: '03', title: 'Release Payment',
    desc: 'On acceptance, the final escrow tranche releases to the company in under an hour.' },
]

const roles: Role[] = [
  { role: 'Superadmin', initial: 'S', color: '#0050F8', points: ['Full platform control', 'Recruitment pipeline', 'Payroll & HR ops', 'Revenue reporting'] },
  { role: 'Editor', initial: 'E', color: '#3B82F6', points: ['View assigned projects', 'Submit deliverables', 'ESS: leave & payslips', 'Track KPI & bonuses'] },
  { role: 'Client', initial: 'C', color: '#10B981', points: ['Search & book editors', 'Approve briefs & scopes', 'Track revision status', 'Secure escrow payments'] },
  { role: 'Mediator', initial: 'M', color: '#F59E0B', points: ['Review dispute evidence', 'AI change detection', 'Issue binding decisions', 'Immutable resolution log'] },
  { role: 'Admin Manager', initial: 'A', color: '#EC4899', points: ['Approve leave requests', 'Rate editor performance', 'Monitor attendance', 'Manage team KPIs'] },
  { role: 'Finance', initial: 'F', color: '#06B6D4', points: ['Escrow reconciliation', 'Revenue recognition', 'Payroll processing', 'IFRS 15 compliance'] },
]

const stats: Stat[] = [
  { value: '11', label: 'Modules', sub: 'HR to Finance, all connected' },
  { value: '6', label: 'User roles', sub: 'Granular access control' },
  { value: '48h', label: 'Dispute SLA', sub: 'Mediator auto-assigned' },
  { value: '≥85%', label: 'AI accuracy', sub: 'Revision classification' },
]

const faqs: Faq[] = [
  { q: 'How does the Revision Envelope keep scope fair?',
    a: 'Every project defines what is INCLUDED, EXCLUDED, and the ALLOWANCE of free rounds. Once the brief is signed, the boundary is locked and visible to both sides — so a "small tweak" never quietly becomes unpaid rework.' },
  { q: 'When does money actually move?',
    a: 'A 50% down payment is held in escrow when the contract is approved. The final 50% is collected before delivery and released to the company within one hour of the client accepting the deliverable.' },
  { q: 'What happens when the AI is unsure about a revision?',
    a: 'If the classifier confidence drops below 85%, the revision is flagged for a human mediator. Every decision — AI or manual — is logged with its evidence for the audit trail.' },
  { q: 'How is editor compensation calculated?',
    a: 'KPI blends client rating, on-time completion rate, and a quarterly manager assessment. Those bands feed project bonuses, so pay tracks measured performance rather than opinion.' },
  { q: 'Is this just a demo or a full system?',
    a: 'This build runs all 11 modules end-to-end with realistic mock data — no setup required. You can move through booking, delivery, classification, and payout as any of the six roles.' },
]

const partners = ['Aperture', 'Frame & Co', 'Studio Nord', 'Pixelwright', 'Lumen Labs']

export default function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#FBFBFB] text-[#1a1a1a] antialiased"
      style={{ fontFamily: "'Open Runde', 'Inter', -apple-system, sans-serif" }}
    >
      <Nav />
      <Hero />
      <Features />
      <LogoCloud />
      <HowItWorks />
      <Roles />
      <Stats />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  )
}

/* ── Nav ── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[#FBFBFB]/85 backdrop-blur-md border-b border-[#EDEDED]">
      <nav aria-label="Main navigation" className="max-w-[1140px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <img src={logoDark} alt="Manava" className="h-7 w-auto object-contain object-left" />
        <div className="hidden md:flex items-center gap-0.5">
          {['Platform', 'How it works', 'Roles', 'FAQ'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-[14px] text-[#596074] hover:text-[#1a1a1a] px-3.5 py-2 rounded-full hover:bg-white transition-colors duration-150"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex text-[14px] text-[#596074] hover:text-[#1a1a1a] px-3.5 py-2 rounded-full hover:bg-white transition-colors duration-150">
            Log in
          </Link>
          <Link
            to="/login"
            className="text-[14px] font-semibold text-[#021526] bg-[#D0F100] hover:brightness-95 px-4 py-2 rounded-full transition-all duration-150"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  )
}

/* ── Hero ── */
function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-[#021526]">
      {/* blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[680px]"
        style={{ background: 'radial-gradient(60% 60% at 50% 0%, rgba(0,80,248,0.55) 0%, rgba(0,80,248,0.12) 38%, rgba(2,21,38,0) 70%)' }}
      />
      <div className="relative max-w-[860px] mx-auto px-6 pt-20 pb-28 text-center">
        <span className="inline-flex items-center gap-2 text-[12px] font-medium text-white/80 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#D0F100]" />
          v2.2 · Now with the AI revision classifier
        </span>

        <h1
          id="hero-heading"
          className="text-[clamp(2.9rem,7vw,5.25rem)] font-bold leading-[1.03] tracking-[-0.04em] text-white mb-7"
          style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
        >
          From Brief to Payment,
          <br />
          <span className="text-[#D0F100]">Fairly</span> Automated.
        </h1>

        <p className="text-[clamp(1rem,1.8vw,1.18rem)] text-[#9aa3bd] max-w-[560px] mx-auto mb-10 leading-[1.65]">
          Manava unifies HR, service delivery, and finance for visual studios — scope
          certainty, secure escrow payments, and objective dispute resolution.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 bg-[#D0F100] hover:brightness-95 text-[#021526] font-semibold px-7 py-3.5 rounded-full text-[15px] transition-all duration-200"
          >
            Launch the Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white font-medium px-7 py-3.5 rounded-full text-[15px] transition-all duration-200"
          >
            See how it works <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Built for professional visual services teams
        </p>
      </div>
    </section>
  )
}

/* ── Features (bento) ── */
function Features() {
  return (
    <section id="platform" className="py-24">
      <div className="max-w-[1140px] mx-auto px-6">
        <SectionHead
          eyebrow="Platform"
          title="Everything your visual studio needs."
          subtitle="One connected system from the first brief to the final payout."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {features.map(({ icon: Icon, title, tag, desc }) => (
            <article
              key={title}
              className="group p-7 rounded-[20px] bg-white border border-[#EDEDED] hover:border-[#D9D9D9] hover:shadow-[0_8px_30px_rgba(2,21,38,0.06)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-[14px] bg-[#021526] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-[#596074] bg-[#FAFAFA] border border-[#EDEDED] px-3 py-1 rounded-full whitespace-nowrap">
                  {tag}
                </span>
              </div>
              <h3 className="font-semibold text-[#1a1a1a] text-[17px] mb-2 tracking-[-0.01em]">{title}</h3>
              <p className="text-[14px] text-[#596074] leading-[1.6] max-w-[44ch]">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Logo cloud ── */
function LogoCloud() {
  return (
    <section className="border-y border-[#EDEDED] bg-[#FAFAFA]">
      <div className="max-w-[1140px] mx-auto px-6 py-12">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa3bd] mb-7">
          Trusted by teams building fairer studios
        </p>
        <div className="flex items-center justify-center gap-x-12 gap-y-4 flex-wrap">
          {partners.map(name => (
            <span key={name} className="text-[17px] font-semibold text-[#021526] opacity-30 tracking-[-0.01em]"
              style={{ fontFamily: "'Inter Display', sans-serif" }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works (dark) ── */
function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#021526] py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]"
        style={{ background: 'radial-gradient(50% 70% at 50% 100%, rgba(0,80,248,0.28) 0%, rgba(2,21,38,0) 70%)' }}
      />
      <div className="relative max-w-[1140px] mx-auto px-6">
        <SectionHead
          dark
          eyebrow="How it works"
          title="Order, from booking to bank."
          subtitle="Three phases keep every engagement predictable for the studio and the client."
        />
        <div className="grid md:grid-cols-3 gap-3.5">
          {steps.map(({ icon: Icon, step, title, desc }) => (
            <article
              key={step}
              className="p-7 rounded-[20px] bg-[#0c2438] border border-white/[0.08] hover:border-white/[0.16] transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-7">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#021526]" />
                </div>
                <span className="text-[13px] font-semibold text-[#D0F100] tabular-nums">{step}</span>
              </div>
              <h3 className="font-semibold text-white text-[18px] mb-2 tracking-[-0.01em]">{title}</h3>
              <p className="text-[14px] text-[#9aa3bd] leading-[1.6]">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Roles ── */
function Roles() {
  return (
    <section id="roles" className="py-24">
      <div className="max-w-[1140px] mx-auto px-6">
        <SectionHead
          eyebrow="Access control"
          title="Built for every role."
          subtitle="Each user sees exactly what they need — nothing more, nothing less."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {roles.map(({ role, initial, color, points }) => (
            <article
              key={role}
              className="p-7 rounded-[20px] bg-white border border-[#EDEDED] hover:border-[#D9D9D9] hover:shadow-[0_8px_30px_rgba(2,21,38,0.06)] transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white text-[14px] font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <h3 className="font-semibold text-[#1a1a1a] text-[16px] tracking-[-0.01em]">{role}</h3>
              </div>
              <ul className="space-y-2.5">
                {points.map(p => (
                  <li key={p} className="flex items-center gap-2.5 text-[13.5px] text-[#596074]">
                    <Check className="w-[15px] h-[15px] text-[#10B981] flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Stats ── */
function Stats() {
  return (
    <section className="border-y border-[#EDEDED] bg-[#FAFAFA]">
      <div className="max-w-[1140px] mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map(({ value, label, sub }, i) => (
            <div
              key={label}
              className={`text-center px-6 py-2 ${i === 1 || i === 3 ? 'border-l border-[#EDEDED]' : ''} ${i === 2 ? 'md:border-l md:border-[#EDEDED]' : ''}`}
            >
              <p
                className="text-[clamp(2.5rem,5vw,3.6rem)] font-bold tracking-[-0.05em] text-[#021526] leading-none mb-2 tabular-nums"
                style={{ fontFamily: "'Inter Display', sans-serif" }}
              >
                {value}
              </p>
              <p className="text-[14px] font-semibold text-[#1a1a1a] mb-1">{label}</p>
              <p className="text-[12px] text-[#9aa3bd] leading-snug">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ── */
function FaqSection() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="py-24">
      <div className="max-w-[760px] mx-auto px-6">
        <SectionHead
          eyebrow="FAQ"
          title="Everything to know before you start."
          subtitle="The short version of how Manava keeps work and pay fair."
        />
        <div className="divide-y divide-[#EDEDED] border-y border-[#EDEDED]">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i
            return (
              <div key={q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                >
                  <span className="text-[16px] font-semibold text-[#1a1a1a] tracking-[-0.01em]">{q}</span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#EDEDED] flex items-center justify-center text-[#021526] group-hover:bg-[#021526] group-hover:text-white transition-colors">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </button>
                <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="text-[14.5px] text-[#596074] leading-[1.65] pb-5 pr-10 max-w-[60ch]">{a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA (dark) ── */
function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#021526] py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px]"
        style={{ background: 'radial-gradient(55% 80% at 50% 0%, rgba(0,80,248,0.4) 0%, rgba(2,21,38,0) 68%)' }}
      />
      <div className="relative max-w-[680px] mx-auto px-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-6">Demo</p>
        <h2
          className="text-[clamp(2rem,4.5vw,3.25rem)] font-bold tracking-[-0.035em] text-white leading-[1.08] mb-5"
          style={{ fontFamily: "'Inter Display', sans-serif" }}
        >
          Start running fair
          <br />
          revisions today.
        </h2>
        <p className="text-[#9aa3bd] text-[15px] mb-10 leading-[1.65] max-w-[400px] mx-auto">
          Explore all 11 modules with full mock data, as any of the six roles. No setup required.
        </p>
        <Link
          to="/login"
          className="group inline-flex items-center gap-2.5 bg-[#D0F100] hover:brightness-95 text-[#021526] font-semibold px-8 py-4 rounded-full text-[15px] transition-all duration-200"
        >
          Launch Manava Demo
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
        </Link>
      </div>
    </section>
  )
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="bg-[#021526] border-t border-white/[0.08] py-12">
      <div className="max-w-[1140px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <img src={logoLight} alt="Manava" className="h-6 w-auto object-contain object-left" />
        <p className="text-white/40 text-[12px] text-center">
          Kelompok 5 · Universitas Islam Indonesia · ISD Project v2.2
        </p>
        <p className="text-white/40 text-[12px]">© 2026 Manava</p>
      </div>
    </footer>
  )
}

/* ── Shared section header ── */
function SectionHead({ eyebrow, title, subtitle, dark }: { eyebrow: string; title: string; subtitle: string; dark?: boolean }) {
  return (
    <header className="mb-12 max-w-[560px]">
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] mb-4 ${dark ? 'text-[#D0F100]' : 'text-[#9aa3bd]'}`}>
        {eyebrow}
      </p>
      <h2
        className={`text-[clamp(1.85rem,4vw,2.85rem)] font-bold tracking-[-0.03em] leading-[1.12] mb-4 ${dark ? 'text-white' : 'text-[#021526]'}`}
        style={{ fontFamily: "'Inter Display', sans-serif" }}
      >
        {title}
      </h2>
      <p className={`text-[15px] leading-relaxed ${dark ? 'text-[#9aa3bd]' : 'text-[#596074]'}`}>{subtitle}</p>
    </header>
  )
}
