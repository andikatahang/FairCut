interface HomeHeroProps {
  fullName: string
  roleLabel: string
  subtitle: string
  avatarUrl?: string
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function todayLong(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

export function HomeHero({ fullName, roleLabel, subtitle, avatarUrl }: HomeHeroProps) {
  const initials = fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const firstName = fullName.split(' ')[0]

  return (
    <header
      className="flex items-center gap-4 sm:gap-5"
      style={{ fontFamily: "'Inter Display', 'Open Runde', sans-serif" }}
    >
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full object-cover ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(2,21,38,0.18)]"
          />
        ) : (
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-[#021526] flex items-center justify-center text-white text-[20px] font-bold tracking-[-0.02em] ring-4 ring-white shadow-[0_8px_24px_-8px_rgba(2,21,38,0.18)]">
            {initials}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#10B981] rounded-full ring-[3px] ring-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#596074]">
          {todayLong()}
        </p>
        <h1 className="text-[clamp(1.5rem,3.6vw,2rem)] font-bold tracking-[-0.03em] text-[#021526] leading-[1.1] mt-0.5">
          {getGreeting()}, {firstName}.
        </h1>
        <p className="text-[13px] sm:text-[14px] text-[#596074] mt-1 leading-relaxed">
          <span className="font-medium text-[#021526]/70">{roleLabel}</span>
          <span className="mx-1.5 text-[#596074]/40">·</span>
          {subtitle}
        </p>
      </div>
    </header>
  )
}
