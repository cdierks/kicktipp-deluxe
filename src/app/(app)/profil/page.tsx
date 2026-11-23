import Link from 'next/link'
import type { CSSProperties } from 'react'
import { PlayerAvatar, Scoreboard, PointsToken, JokerMark } from '@/components/design-primitives'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClubByName } from '@/lib/clubs'
import { ClubIcon } from '@/components/club-icon'
import { IconPalette, IconMail, IconBallFootball, IconUser } from '@/components/app-icons'
import { Button } from '@/components/ui/button'
import { ProfileForm } from './profile-form'
import { ColorPicker } from './color-picker'
import { PageHeader } from '@/components/page-header'
import { PageFrame } from '@/components/page-frame'
import { userColorVars } from '@/lib/user-tone'

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
    <PageFrame>
      <PageHeader
        eyebrow="Dein Bereich"
        title="Profil"
        description="Verwalte deine Angaben, deine Farbe und die öffentliche Ansicht in einer klaren Oberfläche."
      />
      <section className="flex flex-wrap items-center gap-5 rounded-2xl bg-hero p-6 text-hero-foreground" aria-label="Dein Profil">
        <PlayerAvatar nickname={user.nickname} favoriteTeam={user.favoriteTeam} color={user.color} />
        <div className="min-w-0 flex-1"><p className="text-sm text-hero-foreground/75">Dein Profil</p><h2 className="truncate text-3xl font-wide text-lime-300">{user.nickname}</h2><p className="mt-1 text-sm text-hero-foreground/75">{club?.name ?? 'Noch kein Lieblingsclub'} · {colorLabel ?? 'Noch keine Spielerfarbe'}</p></div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start 2xl:gap-8">
        <div className="space-y-6 2xl:space-y-8">
          <div className="surface rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <IconPalette className="h-4 w-4 text-primary-readable" strokeWidth={1.5} />
              <h2 className="text-sm font-bold text-foreground">
                Meine Farbe
              </h2>
            </div>
            <ColorPicker
              palette={paletteWithAvailability}
              currentColor={user.color}
            />
          </div>

          <ProfileForm user={user} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 2xl:space-y-8">
          <div className="surface-raised rounded-xl p-4">
            <div className="flex items-start gap-4">
              <PlayerAvatar nickname={user.nickname} favoriteTeam={user.favoriteTeam} color={user.color} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary-readable">
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
                  <ClubIcon src={club.iconUrl} fallbackSrc={club.iconSourceUrl} label={club.name} className="h-5 w-5 shrink-0 object-contain" />
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
                    className="h-4 w-4 shrink-0 rounded-full bg-(--uc) ring-1 ring-neutral-50/20 dark:bg-(--uc-dark)"
                    style={userColorVars(user.color) as CSSProperties}
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

          <div className="surface rounded-xl p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Ansicht im Spiel
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 rounded-xl bg-pitch-100 px-2.5 py-1.5 dark:bg-pitch-900">
                {user.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 bg-(--uc) dark:bg-(--uc-dark)"
                    style={userColorVars(user.color) as CSSProperties}
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-primary-readable">{user.nickname}</span>
                <div className="grid shrink-0 grid-cols-[3.25rem_2rem] items-center gap-1.5">
                  <Scoreboard result="2:1" /><PointsToken points={4} />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted px-2.5 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-warning-300" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">Mitspieler</span>
                <div className="grid shrink-0 grid-cols-[3.25rem_auto_2rem] items-center gap-1.5">
                  <Scoreboard result="3:2" /><JokerMark compact /><PointsToken points={8} tier={4} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              So erscheinst du in der Übersicht und im Vergleich mit den anderen Spielern.
            </p>
          </div>

        </div>
      </div>
    </PageFrame>
  )
}
