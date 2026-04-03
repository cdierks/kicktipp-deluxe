import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getClubByName } from '@/lib/clubs'
import { cn } from '@/lib/utils'
import {
  IconMoodSmileBeam,
  IconPencil,
  IconTrophy,
  IconMedal,
  IconChartBar,
  IconFlame,
  IconTarget,
  IconBallFootball,
  IconScale,
  IconPokerChip,
} from '@/components/app-icons'
import { PlayerCharts } from './player-charts'
import type { LinePoint, QualitySlice } from './player-charts'

const HIT_COLORS = {
  exact: '#1d4ed8',
  diff: '#3b82f6',
  outcome: '#93c5fd',
  miss: '#9ca3af',
}

const JOKER_COLORS = {
  exact: '#f59e0b',
  diff: '#fbbf24',
  outcome: '#fde68a',
  miss: '#9ca3af',
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
  const playerColor = normalizeHexColor(user.color) ?? '#1d4ed8'

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
    const [seasonPointsAll, allSeasonTips, allCompletedMatchdays] = await Promise.all([
      prisma.tip.groupBy({
        by: ['userId'],
        where: {
          match: { matchday: { seasonId: activeSeason.id } },
          points: { not: null },
        },
        _sum: { points: true },
        orderBy: { _sum: { points: 'desc' } },
      }),
      prisma.tip.findMany({
        where: {
          userId: user.id,
          match: { matchday: { seasonId: activeSeason.id } },
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
        where: { seasonId: activeSeason.id, status: 'COMPLETED' },
        orderBy: { matchdayNumber: 'asc' },
        select: { id: true, matchdayNumber: true },
      }),
    ])

    const myEntry = seasonPointsAll.find((e) => e.userId === user.id)
    seasonTotal = myEntry?._sum.points ?? 0
    const rankIdx = seasonPointsAll.findIndex((e) => e.userId === user.id)
    rank = rankIdx >= 0 ? rankIdx + 1 : seasonPointsAll.length + 1

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

      if (points === 4 || points === 8) exact += 1
      else if (points === 3 || points === 6) diff += 1
      else if (points === 2) outcome += 1
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

    for (const md of allCompletedMatchdays) {
      const pts = pointsByMatchdayId[md.id] ?? 0
      if (!record || pts > record.points) {
        record = { points: pts, matchdayNumber: md.matchdayNumber }
      }
    }

    avgPerMatchday =
      allCompletedMatchdays.length > 0
        ? Math.round((seasonTotal / allCompletedMatchdays.length) * 10) / 10
        : 0

    let cumulative = 0
    lineData = allCompletedMatchdays.map((md) => {
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
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="surface overflow-hidden rounded-[1.85rem] p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.55rem] text-white shadow-lg ring-4 ring-white/20"
                style={{ backgroundColor: playerColor }}
              >
                <IconMoodSmileBeam className="h-10 w-10" />
              </div>
              {isMe && (
                <Link
                  href="/profil"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-background/75 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <IconPencil className="h-3.5 w-3.5" />
                  Bearbeiten
                </Link>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Player Control Center
              </p>
              <h1 className="text-4xl leading-none text-foreground sm:text-5xl">
                {user.nickname}
              </h1>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>

            {club ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={club.iconUrl} alt="" className="h-4.5 w-4.5 object-contain shrink-0" />
                  <span className="font-medium text-foreground">{club.name}</span>
                  <span className="text-xs text-muted-foreground">BL{club.league}</span>
                </span>
              </div>
            ) : user.favoriteTeam ? (
              <p className="mt-4 text-sm text-foreground">{user.favoriteTeam}</p>
            ) : null}
          </div>
        </div>
      </section>

      {activeSeason ? (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Saison {activeSeason.year}/{parseInt(activeSeason.year) + 1}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryChip label="Trefferquote" value={total > 0 ? `${hitRate}%` : '–'} tone="blue" />
            <SummaryChip label="Joker-Bonus" value={jokerTotal > 0 ? `+${jokerSummary.bonus}` : '–'} tone="amber" />
            <SummaryChip label="Fehlquote" value={total > 0 ? `${missPct}%` : '–'} tone="gray" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <KpiCard icon={<IconTrophy className="h-3.5 w-3.5" />} label="Saisonpunkte" value={seasonTotal} highlight />
            <KpiCard icon={<IconMedal className="h-3.5 w-3.5" />} label="Rang" value={rank > 0 ? `${rank}.` : '–'} />
            <KpiCard icon={<IconChartBar className="h-3.5 w-3.5" />} label="Ø / Spieltag" value={avgPerMatchday} />
            <KpiCard
              icon={<IconFlame className="h-3.5 w-3.5" />}
              label="Rekord"
              value={record ? `${record.points}P` : '–'}
              sub={record ? `ST ${record.matchdayNumber}` : undefined}
            />
            <KpiCard icon={<IconTarget className="h-3.5 w-3.5" />} label="Exakt" value={total > 0 ? `${exactPct}%` : '–'} />
            <KpiCard icon={<IconBallFootball className="h-3.5 w-3.5" />} label="Getippt" value={total} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.95fr)]">
            <PlayerCharts lineData={lineData} qualityData={qualityData} lineColor={playerColor} />

            <div className="grid gap-4">
              <section className="surface overflow-hidden rounded-[1.35rem] border border-border/70 px-4 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground">
                    <IconScale className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tipp-Profil
                  </p>
                </div>
                <div className="grid gap-3">
                  <MetricRow label="Trefferquote" value={total > 0 ? `${hitRate}%` : '–'} tone="text-primary" />
                  <MetricRow label="Fehlquote" value={total > 0 ? `${missPct}%` : '–'} tone="text-muted-foreground" />
                  <MetricRow label="Exaktquote" value={total > 0 ? `${exactPct}%` : '–'} tone="text-blue-300" />
                </div>
                <div className="mt-4 grid gap-2">
                  <RiskBar label="Heim" value={risk.home} tone="primary" />
                  <RiskBar label="Auswärts" value={risk.away} tone="accent" />
                  <RiskBar label="Unentsch." value={risk.draw} tone="muted" />
                </div>
              </section>

              <section className="surface overflow-hidden rounded-[1.35rem] border border-border/70 px-4 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-500">
                    <IconPokerChip className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
                  <div className="rounded-xl border border-border/60 bg-background/65 px-4 py-5 text-sm text-muted-foreground">
                    In dieser Saison wurde noch kein Joker gesetzt.
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : (
        <section className="surface-muted rounded-[1.35rem] border border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
          Keine aktive Saison gefunden.
        </section>
      )}
    </div>
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
    <div className="surface flex min-h-[7.75rem] flex-col overflow-hidden rounded-[1.35rem] border border-border/70 px-4 py-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground">
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn('text-3xl leading-none tabular-nums text-foreground', highlight && 'text-primary')}>
        {value}
      </p>
      <div className="mt-auto pt-3">
        <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2 text-xs text-muted-foreground">
          {sub ?? 'Saisonanalyse'}
        </div>
      </div>
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
    blue: 'border-primary/15 bg-background text-primary',
    amber: 'border-amber-400/15 bg-background text-amber-500',
    gray: 'border-border/70 bg-background text-muted-foreground',
  }[tone]

  return (
    <div className={cn('surface rounded-[1.35rem] border px-3 py-3', toneClass, compact && 'rounded-xl px-2.5 py-2.5')}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/65 px-3 py-2 text-sm">
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
    ? 'text-primary'
    : tone === 'accent'
      ? 'text-accent'
      : 'text-muted-foreground'

  const trackClass = tone === 'primary'
    ? 'bg-primary/10'
    : tone === 'accent'
      ? 'bg-accent/10'
      : 'bg-muted'

  const fillClass = tone === 'primary'
    ? 'bg-primary'
    : tone === 'accent'
      ? 'bg-accent'
      : 'bg-muted-foreground/70'

  return (
    <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2">
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
