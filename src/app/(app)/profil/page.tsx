import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClubByName } from '@/lib/clubs'
import { IconPalette, IconUser, IconMail, IconBallFootball, IconPokerChip } from '@tabler/icons-react'
import { ProfileForm } from './profile-form'
import { ColorPicker } from './color-picker'

export default async function ProfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [user, palette, takenColors] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, nickname: true, favoriteTeam: true, email: true, color: true },
    }),
    prisma.colorPalette.findMany({ orderBy: { order: 'asc' } }),
    prisma.user.findMany({
      where: { color: { not: null }, NOT: { id: session.user.id } },
      select: { color: true },
    }),
  ])
  if (!user) redirect('/login')

  const takenSet = new Set(takenColors.map((u) => u.color!))
  const paletteWithAvailability = palette.map((c) => ({
    hex: c.hex,
    label: c.label,
    available: !takenSet.has(c.hex),
  }))

  const club = user.favoriteTeam ? getClubByName(user.favoriteTeam) : undefined
  const colorLabel = palette.find((c) => c.hex === user.color)?.label
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Profil
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

        {/* ── Left column: Settings ── */}
        <div className="space-y-5">

          {/* Color picker */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <IconPalette className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <h2 className="text-sm font-bold tracking-wide text-foreground">
                Meine Farbe
              </h2>
            </div>
            <ColorPicker
              palette={paletteWithAvailability}
              currentColor={user.color}
            />
          </div>

          <ProfileForm userId={session.user.id} user={user} />
        </div>

        {/* ── Right column: Profile preview ── */}
        <div className="space-y-4 lg:sticky lg:top-24">

          {/* Hero card */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Color accent strip */}
            <div
              className="h-24 w-full"
              style={{
                background: user.color
                  ? user.color
                  : 'var(--color-primary)',
              }}
            />
            <div className="px-6 pb-6">
              {/* Avatar – overlaps the banner */}
              <div
                className="relative -mt-10 mb-4 h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white/20"
                style={{ backgroundColor: user.color ?? 'var(--color-primary)' }}
              >
                {initials}
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {user.nickname}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{user.name}</p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <IconMail className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <span className="text-muted-foreground truncate">{user.email}</span>
                </div>

                {club ? (
                  <div className="flex items-center gap-2.5 text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={club.iconUrl} alt="" className="h-5 w-5 object-contain shrink-0" />
                    <span className="text-foreground font-medium">{club.shortName}</span>
                    <span className="text-xs text-muted-foreground">Lieblingsclub</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-sm">
                    <IconBallFootball className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <span className="text-muted-foreground">Kein Lieblingsclub</span>
                  </div>
                )}

                {user.color && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/20"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-foreground font-medium">{colorLabel ?? user.color}</span>
                    <span className="text-xs text-muted-foreground">Spielerfarbe</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview: wie du in der Tipp-Übersicht erscheinst */}
          <div className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Vorschau – Tipp-Zeile
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Own entry */}
              <div className="flex items-center gap-1.5">
                {user.color && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                )}
                <span className="text-xs font-semibold text-primary">{user.nickname}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">2:1</span>
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-xs font-bold bg-primary text-primary-foreground">
                  4
                </span>
              </div>
              {/* Joker example */}
              <div className="flex items-center gap-1.5 opacity-40">
                <span className="text-xs text-muted-foreground">Mitspieler</span>
                <span className="text-sm font-bold tabular-nums text-foreground">1:0</span>
                <IconPokerChip className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1 text-xs font-bold border border-primary/40 text-primary">
                  2
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              So sehen dich andere Spieler in der Dashboard-Ansicht.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
