import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClubByName } from '@/lib/clubs'
import { cn } from '@/lib/utils'
import { IconPalette, IconMail, IconBallFootball, IconPokerChip, IconUser } from '@/components/app-icons'
import { Button } from '@/components/ui/button'
import { ProfileForm } from './profile-form'
import { ColorPicker } from './color-picker'

function PreviewPointsBadge({ points, isJoker = false }: { points: number; isJoker?: boolean }) {
  const className = cn(
    'inline-flex h-7 min-w-[1.85rem] items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums shadow-sm',
    !isJoker && points === 4 && 'border-blue-700 bg-blue-700 text-white',
    !isJoker && points === 3 && 'border-blue-600 bg-blue-600 text-white',
    !isJoker && points === 2 && 'border-blue-300 bg-blue-300/20 text-blue-300',
    points === 0 && 'border-gray-500/35 bg-gray-500/12 text-gray-300',
    isJoker && points === 8 && 'border-amber-400 bg-amber-400 text-gray-950',
    isJoker && points === 6 && 'border-amber-500 bg-amber-500/80 text-gray-950',
    isJoker && points === 4 && 'border-amber-300 bg-amber-300/20 text-amber-300',
  )

  return <span className={className}>{points}</span>
}

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

  return (
    <div className="space-y-6">
      <div className="surface rounded-[1.75rem] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Dein Bereich
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
          Profil
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Verwalte deine Angaben, deine Farbe und die öffentliche Ansicht in einer klaren Oberfläche.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
        <div className="space-y-5">
          <div className="surface rounded-[1.5rem] p-5">
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

        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="surface rounded-[1.5rem] p-5">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.2rem] text-white ring-1 ring-white/14"
                style={{ backgroundColor: user.color ?? 'var(--color-primary)' }}
              >
                {club?.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.iconUrl} alt="" className="h-9 w-9 object-contain" />
                ) : (
                  <IconUser className="h-7 w-7 text-white" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Öffentliche Ansicht
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {user.nickname}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <IconMail className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="truncate text-muted-foreground">{user.email}</span>
              </div>

              {club ? (
                <div className="flex items-center gap-2.5 text-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={club.iconUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
                  <span className="font-medium text-foreground">{club.shortName}</span>
                  <span className="text-xs text-muted-foreground">Lieblingsclub</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-sm">
                  <IconBallFootball className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-muted-foreground">Kein Lieblingsclub</span>
                </div>
              )}

              {user.color && (
                <div className="flex items-center gap-2.5 text-sm">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="font-medium text-foreground">{colorLabel ?? user.color}</span>
                  <span className="text-xs text-muted-foreground">Spielerfarbe</span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/spieler/${user.nickname}`}>
                  <IconUser className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Öffentliches Profil öffnen
                </Link>
              </Button>
            </div>
          </div>

          <div className="surface rounded-[1.5rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Ansicht im Spiel
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-2.5 py-1.5">
                {user.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: user.color }}
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-primary">{user.nickname}</span>
                <div className="grid shrink-0 grid-cols-[3.25rem_2rem] items-center gap-1.5">
                  <span className="rounded-lg bg-background/80 px-2 py-0.5 text-center text-sm font-bold tabular-nums text-foreground">2:1</span>
                  <PreviewPointsBadge points={4} />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/55 px-2.5 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-yellow-300" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">Mitspieler</span>
                <div className="grid shrink-0 grid-cols-[3.25rem_auto_2rem] items-center gap-1.5">
                  <span className="rounded-lg bg-background/80 px-2 py-0.5 text-center text-sm font-bold tabular-nums text-foreground">3:2</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10">
                    <IconPokerChip className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
                  </span>
                  <PreviewPointsBadge points={8} isJoker />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              So erscheinst du in der Übersicht und im Vergleich mit den anderen Spielern.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
