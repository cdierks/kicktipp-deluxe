import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ClubIcon } from '@/components/club-icon'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClubByName } from '@/lib/clubs'
import { cn } from '@/lib/utils'
import {
  IconPencil,
  IconTrophy,
  IconMedal,
  IconChartBar,
  IconFlame,
  IconScale,
  IconPokerChip,
  IconUser,
} from '@/components/app-icons'
import { PlayerCharts } from './player-charts'
import type { LinePoint, QualitySlice } from './player-charts'
import { PageFrame } from '@/components/page-frame'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { getEvaluatedSeasonMatchdays } from '@/lib/matchday'

const HIT_COLORS = {
  exact: 'var(--color-primary-800)',
  diff: 'var(--color-primary-600)',
  outcome: 'var(--color-primary-300)',
  miss: 'var(--color-neutral-400)',
}

const JOKER_COLORS = {
  exact: 'var(--color-warning-700)',
  diff: 'var(--color-warning-500)',
  outcome: 'var(--color-warning-300)',
  miss: 'var(--color-neutral-400)',
}

function normalizeHexColor(color: string | null | undefined) {
  if (!color) return null
  const value = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return null
}

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

export default async function SpielerPage({
  params,
}: {
  params: Promise<{ nickname: string }>
}) {
  const { nickname } = await params

  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { nickname },
    select: { id: true, nickname: true, name: true, favoriteTeam: true, color: true },
  })
  if (!user) notFound()

  const isMe = session.user.id === user.id
  const club = user.favoriteTeam ? getClubByName(user.favoriteTeam) : undefined
  const playerColor = normalizeHexColor(user.color) ?? 'var(--color-primary-600)'

  const activeSeason = await prisma.season.findFirst({
    where: { active: true },
    select: { id: true, year: true },
  })

  let seasonTotal = 0
  let rank = 0
  let lineData: LinePoint[] = []
  let qualityData: QualitySlice[] = []
  let avgPerMatchday = 0
  let record: { points: number; matchdayNumber: number } | null = null
  let risk = { home: 0, away: 0, draw: 0 }
  let total = 0
  let hitRate = 0
  let exactPct = 0
  let missPct = 0
  let jokerSummary = { used: 0, bonus: 0, exact: 0, diff: 0, outcome: 0, miss: 0 }

  if (activeSeason) {
    const now = new Date()
    const evaluatedMatchdays = await getEvaluatedSeasonMatchdays(activeSeason.id, now)
    const evaluatedMatchdayIds = evaluatedMatchdays.map((matchday) => matchday.id)
    const [seasonPointsAll, allSeasonTips, allEvaluatedMatchdays] = await Promise.all([
      prisma.tip.groupBy({
        by: ['userId'],
        where: {
          match: {
            matchdayId: { in: evaluatedMatchdayIds },
          },
          points: { not: null },
        },
        _sum: { points: true },
        orderBy: { _sum: { points: 'desc' } },
      }),
      prisma.tip.findMany({
        where: {
          userId: user.id,
          // Public profiles use the same effective deadline as the dashboard.
          match: { matchdayId: { in: evaluatedMatchdayIds } },
          points: { not: null },
        },
        select: {
          homeScore: true,
          awayScore: true,
          points: true,
          isJoker: true,
          match: { select: { matchdayId: true } },
        },
      }),
      prisma.matchday.findMany({
        where: {
          id: { in: evaluatedMatchdayIds },
        },
        orderBy: { matchdayNumber: 'asc' },
        select: { id: true, matchdayNumber: true },
      }),
    ])

    const myEntry = seasonPointsAll.find((e) => e.userId === user.id)
    seasonTotal = myEntry?._sum.points ?? 0
    const rankIdx = seasonPointsAll.findIndex((e) => e.userId === user.id)
    if (evaluatedMatchdayIds.length > 0) {
      rank = rankIdx >= 0 ? rankIdx + 1 : seasonPointsAll.length + 1
    }

    let exact = 0
    let diff = 0
    let outcome = 0
    let miss = 0
    let home = 0
    let away = 0
    let draw = 0

    const pointsByMatchdayId: Record<string, number> = {}

    for (const t of allSeasonTips) {
      const points = t.points ?? 0

      if (t.isJoker) {
        jokerSummary.used += 1
        if (points === 8) {
          jokerSummary.exact += 1
          jokerSummary.bonus += 4
        } else if (points === 6) {
          jokerSummary.diff += 1
          jokerSummary.bonus += 3
        } else if (points === 4) {
          jokerSummary.outcome += 1
          jokerSummary.bonus += 2
        } else {
          jokerSummary.miss += 1
        }
      }

      const basePoints = t.isJoker && points > 0 ? points / 2 : points
      if (basePoints === 4) exact += 1
      else if (basePoints === 3) diff += 1
      else if (basePoints === 2) outcome += 1
      else miss += 1

      const scoreDelta = t.homeScore - t.awayScore
      if (scoreDelta > 0) home += 1
      else if (scoreDelta < 0) away += 1
      else draw += 1

      const mdId = t.match.matchdayId
      pointsByMatchdayId[mdId] = (pointsByMatchdayId[mdId] ?? 0) + points
    }

    total = allSeasonTips.length
    hitRate = total > 0 ? Math.round(((exact + diff + outcome) / total) * 100) : 0
    exactPct = pct(exact, total)
    missPct = pct(miss, total)

    if (total > 0) {
      qualityData = [
        { name: 'Exakt (4P)', value: exact, pct: pct(exact, total), color: HIT_COLORS.exact },
        { name: 'Differenz (3P)', value: diff, pct: pct(diff, total), color: HIT_COLORS.diff },
        { name: 'Tendenz (2P)', value: outcome, pct: pct(outcome, total), color: HIT_COLORS.outcome },
        { name: 'Falsch (0P)', value: miss, pct: pct(miss, total), color: HIT_COLORS.miss },
      ]
    }

    const riskTotal = home + away + draw
    if (riskTotal > 0) {
      risk = {
        home: Math.round((home / riskTotal) * 100),
        away: Math.round((away / riskTotal) * 100),
        draw: Math.round((draw / riskTotal) * 100),
      }
    }

    for (const md of allEvaluatedMatchdays) {
      const pts = pointsByMatchdayId[md.id] ?? 0
      if (!record || pts > record.points) {
        record = { points: pts, matchdayNumber: md.matchdayNumber }
      }
    }

    avgPerMatchday =
      allEvaluatedMatchdays.length > 0
        ? Math.round((seasonTotal / allEvaluatedMatchdays.length) * 10) / 10
        : 0

    let cumulative = 0
    lineData = allEvaluatedMatchdays.map((md) => {
      cumulative += pointsByMatchdayId[md.id] ?? 0
      return { st: `ST ${md.matchdayNumber}`, cumulative }
    })
  }

  const jokerTotal = jokerSummary.used
  const jokerSuccess = jokerSummary.exact + jokerSummary.diff + jokerSummary.outcome
  const jokerSuccessPct = pct(jokerSuccess, jokerTotal)
  const jokerData = [
    { label: 'Exakt (8P)', value: jokerSummary.exact, pct: pct(jokerSummary.exact, jokerTotal), color: JOKER_COLORS.exact },
    { label: 'Differenz (6P)', value: jokerSummary.diff, pct: pct(jokerSummary.diff, jokerTotal), color: JOKER_COLORS.diff },
    { label: 'Tendenz (4P)', value: jokerSummary.outcome, pct: pct(jokerSummary.outcome, jokerTotal), color: JOKER_COLORS.outcome },
    { label: 'Erfolglos (0P)', value: jokerSummary.miss, pct: pct(jokerSummary.miss, jokerTotal), color: JOKER_COLORS.miss },
  ]

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Spielerprofil"
        title={user.nickname}
        leading={
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-neutral-50 ring-1 ring-neutral-50/25"
            style={{ backgroundColor: playerColor }}
          >
            {club?.iconUrl ? (
              <ClubIcon src={club.iconUrl} fallbackSrc={club.iconSourceUrl} label={club.name} className="h-11 w-11 object-contain" />
            ) : (
              <IconUser className="h-9 w-9 text-neutral-50" />
            )}
          </div>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>{user.name}</span>
            {club ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1">
                <ClubIcon src={club.iconUrl} fallbackSrc={club.iconSourceUrl} label={club.name} className="h-4 w-4 shrink-0 object-contain" />
                <span className="font-medium text-foreground">{club.name}</span>
                <span className="text-xs text-muted-foreground">BL{club.league}</span>
              </span>
            ) : user.favoriteTeam ? (
              <span className="text-foreground">{user.favoriteTeam}</span>
            ) : null}
          </span>
        }
        aside={isMe ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/profil">
              <IconPencil className="h-3.5 w-3.5" />
              Bearbeiten
            </Link>
          </Button>
        ) : undefined}
      />

      {activeSeason ? (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-muted-foreground">
              Saison {activeSeason.year}/{parseInt(activeSeason.year) + 1}
            </span>
          </div>

          <div className="surface-raised grid overflow-hidden rounded-xl sm:grid-cols-2 xl:grid-cols-4 [&>*]:border-b [&>*]:border-border sm:[&>*]:border-r xl:[&>*]:border-b-0">
            <KpiCard icon={<IconTrophy className="h-3.5 w-3.5" />} label="Saisonpunkte" value={seasonTotal} highlight />
            <KpiCard icon={<IconMedal className="h-3.5 w-3.5" />} label="Rang" value={rank > 0 ? `${rank}.` : '–'} />
            <KpiCard icon={<IconChartBar className="h-3.5 w-3.5" />} label="Ø / Spieltag" value={avgPerMatchday} />
            <KpiCard
              icon={<IconFlame className="h-3.5 w-3.5" />}
              label="Rekord"
              value={record ? `${record.points}P` : '–'}
              sub={record ? `ST ${record.matchdayNumber}` : undefined}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.95fr)] 2xl:gap-8">
            <PlayerCharts lineData={lineData} qualityData={qualityData} lineColor={playerColor} />

            <div className="grid gap-6 2xl:gap-8">
              <section className="surface-raised overflow-hidden rounded-xl px-4 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                    <IconScale className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Tipp-Profil
                  </p>
                </div>
                <div className="grid gap-3">
                  <MetricRow label="Trefferquote" value={total > 0 ? `${hitRate}%` : '–'} tone="text-primary-readable" />
                  <MetricRow label="Fehlquote" value={total > 0 ? `${missPct}%` : '–'} tone="text-muted-foreground" />
                  <MetricRow label="Exaktquote" value={total > 0 ? `${exactPct}%` : '–'} tone="text-primary-600 dark:text-primary-300" />
                  <MetricRow label="Getippte Spiele" value={`${total}`} tone="text-foreground" />
                </div>
                <div className="mt-4 grid gap-2">
                  <RiskBar label="Heim" value={risk.home} tone="primary" />
                  <RiskBar label="Auswärts" value={risk.away} tone="accent" />
                  <RiskBar label="Unentsch." value={risk.draw} tone="muted" />
                </div>
              </section>

              <section className="surface-raised overflow-hidden rounded-xl px-4 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center text-warning-700 dark:text-warning-300">
                    <IconPokerChip className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    Joker-Fokus
                  </p>
                </div>

                {jokerTotal > 0 ? (
                  <>
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <SummaryChip label="Gesetzt" value={jokerTotal} tone="gray" compact />
                      <SummaryChip label="Bonus" value={`+${jokerSummary.bonus}`} tone="amber" compact />
                      <SummaryChip label="Erfolg" value={`${jokerSuccessPct}%`} tone="blue" compact />
                    </div>
                    <div className="space-y-2.5">
                      {jokerData.map((entry) => (
                        <div key={entry.label} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                          <div className="min-w-0">
                            <div className="mb-1.5 flex items-center gap-2 text-xs">
                              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                              <span className="truncate text-foreground">{entry.label}</span>
                              <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{entry.value}</span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full transition-[width]"
                                style={{ width: `${entry.pct}%`, backgroundColor: entry.color }}
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                          <span className="text-right text-xs font-medium tabular-nums text-muted-foreground">
                            {entry.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted px-4 py-5 text-sm text-muted-foreground">
                    In dieser Saison wurde noch kein Joker gesetzt.
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : (
        <section className="surface-muted rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Keine aktive Saison gefunden.
        </section>
      )}
    </PageFrame>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className="flex min-h-[6.5rem] flex-col px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <span className="flex size-5 shrink-0 items-center justify-center">
          {icon}
        </span>
        <p className="text-xs font-medium">
          {label}
        </p>
      </div>
      <p className={cn('text-3xl leading-none tabular-nums text-foreground', highlight && 'text-primary-readable')}>
        {value}
      </p>
      {sub && <p className="mt-auto pt-2 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function SummaryChip({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string
  value: string | number
  tone: 'blue' | 'amber' | 'gray'
  compact?: boolean
}) {
  const toneClass = {
    blue: 'bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200',
    amber: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    gray: 'bg-muted text-neutral-600 dark:text-neutral-300',
  }[tone]

  return (
    <div className={cn('rounded-lg px-3 py-3', toneClass, compact && 'px-2.5 py-2.5')}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className={cn('mt-1 tabular-nums text-2xl leading-none', compact && 'text-xl')}>{value}</p>
    </div>
  )
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', tone)}>{value}</span>
    </div>
  )
}

function RiskBar({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'primary' | 'accent' | 'muted'
}) {
  const labelClass = tone === 'primary'
    ? 'text-primary-readable'
    : tone === 'accent'
      ? 'text-secondary-700 dark:text-secondary-300'
      : 'text-muted-foreground'

  const trackClass = tone === 'primary'
    ? 'bg-primary-100 dark:bg-primary-900'
    : tone === 'accent'
      ? 'bg-secondary-100 dark:bg-secondary-900'
      : 'bg-neutral-200 dark:bg-neutral-700'

  const fillClass = tone === 'primary'
    ? 'bg-primary'
    : tone === 'accent'
      ? 'bg-accent'
      : 'bg-muted-foreground/70'

  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className={cn('font-medium', labelClass)}>{label}</span>
        <span className={cn('font-semibold tabular-nums', labelClass)}>{value}%</span>
      </div>
      <div className={cn('h-1.5 overflow-hidden rounded-full', trackClass)}>
        <div className={cn('h-full rounded-full', fillClass)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
