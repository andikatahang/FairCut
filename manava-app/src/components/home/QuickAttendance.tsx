import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, Sparkles } from 'lucide-react'

type AttendanceState = 'clocked_out' | 'clocked_in'

interface PersistedAttendance {
  state: AttendanceState
  clockInAt?: string
  clockOutAt?: string
  dateKey: string
}

const STORAGE_KEY = 'manava_attendance'

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function load(): PersistedAttendance {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: PersistedAttendance = JSON.parse(raw)
      if (parsed.dateKey === todayKey()) return parsed
    }
  } catch {}
  return { state: 'clocked_out', dateKey: todayKey() }
}

function save(value: PersistedAttendance): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {}
}

function fmtClock(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d)
}

function fmtElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function QuickAttendance() {
  const [data, setData] = useState<PersistedAttendance>(load)
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    if (data.state !== 'clocked_in') return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [data.state])

  const isIn = data.state === 'clocked_in'
  const inAt = data.clockInAt ? new Date(data.clockInAt) : undefined
  const elapsed = isIn && inAt ? now.getTime() - inAt.getTime() : 0

  function handleClockIn() {
    const next: PersistedAttendance = {
      state: 'clocked_in',
      clockInAt: new Date().toISOString(),
      dateKey: todayKey(),
    }
    setData(next)
    save(next)
  }

  function handleClockOut() {
    const next: PersistedAttendance = {
      ...data,
      state: 'clocked_out',
      clockOutAt: new Date().toISOString(),
    }
    setData(next)
    save(next)
  }

  return (
    <section
      aria-labelledby="quick-attendance-heading"
      className="relative overflow-hidden rounded-[16px] bg-[#021526] text-white p-5 sm:p-6"
      style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 w-64 h-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(208,241,0,0.18) 0%, rgba(2,21,38,0) 70%)' }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D0F100]">
            <Sparkles className="w-3 h-3" />
            Aksi cepat absensi
          </p>
          <h2 id="quick-attendance-heading" className="text-[clamp(1.4rem,3vw,1.8rem)] font-bold tracking-[-0.03em] leading-[1.1] mt-2">
            {isIn ? 'Sedang bertugas' : 'Mulai hari kerja Anda'}
          </h2>
          <p className="text-[13px] text-white/65 mt-1.5 leading-relaxed">
            {isIn
              ? `Clock-in pada ${inAt ? fmtClock(inAt) : '—'} WIB · jangan lupa clock-out sebelum 17:05.`
              : 'Catat kehadiran dengan satu tap. Timer berjalan otomatis sampai Anda clock-out.'}
          </p>
        </div>

        {/* Timer + action */}
        <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              <Clock className="w-3 h-3" />
              {isIn ? 'Berjalan' : 'Siap mulai'}
            </span>
            <span
              className="text-[clamp(1.7rem,4vw,2.4rem)] font-bold text-white tabular-nums tracking-[-0.04em] leading-none mt-1.5"
              aria-live="polite"
            >
              {isIn ? fmtElapsed(elapsed) : '00:00:00'}
            </span>
          </div>

          {isIn ? (
            <button
              type="button"
              onClick={handleClockOut}
              className="group inline-flex items-center gap-2 bg-white hover:brightness-95 text-[#021526] font-semibold px-5 py-3 rounded-full text-[13.5px] transition-all duration-150 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.4)]"
            >
              <LogOut className="w-4 h-4" />
              Clock-out
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClockIn}
              className="group inline-flex items-center gap-2 bg-[#D0F100] hover:brightness-95 text-[#021526] font-semibold px-5 py-3 rounded-full text-[13.5px] transition-all duration-150 shadow-[0_10px_30px_-10px_rgba(208,241,0,0.6)]"
            >
              <LogIn className="w-4 h-4" />
              Clock-in
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
