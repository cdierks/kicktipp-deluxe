import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
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
  IconTarget,
  IconBallFootball,
  IconScale,
} from '@tabler/icons-react'
import { PlayerCharts } from './player-charts'
import type { LinePoint, PieSlice } from './player-charts'

const HIT_COLORS = {
  exact:   '#5347CE', // 4P – Primary Indigo
  diff:    '#4896FE', // 3P – Info Blue
  outcome: '#16C8C7', // 2P – Teal Accent
  miss:    '#94a3b8', // 0P – Muted slate
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

  const initials = user.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const activeSeason = await prisma.season.findFirst({
    where: { active: true },
    select: { id: true, year: true },
  })

  let seasonTotal = 0
  let rank = 0
  let lineData: LinePoint[] = []
  let pieData: PieSlice[] = []
  let avgPerMatchday = 0
  let record: { points: number; matchdayNumber: number } | null = null
  let risk = { home: 0, away: 0, draw: 0 }
  let total = 0
  let exactPct = 0

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

    let exact = 0, diff = 0, outcome = 0, miss = 0
    for (const t of allSeasonTips) {
      if (t.points === 4) exact++
      else if (t.points === 3) diff++
      else if (t.points === 2) outcome++
      else miss++
    }
    total = allSeasonTips.length
    exactPct = total > 0 ? Math.round((exact / total) * 100) : 0

    if (total > 0) {
      pieData = [
        { name: 'Exakt (4P)',     value: exact,   pct: Math.round((exact / total) * 100),   color: HIT_COLORS.exact },
        { name: 'Differenz (3P)', value: diff,    pct: Math.round((diff / total) * 100),    color: HIT_COLORS.diff },
        { name: 'Tendenz (2P)',   value: outcome, pct: Math.round((outcome / total) * 100), color: HIT_COLORS.outcome },
        { name: 'Falsch (0P)',    value: miss,    pct: Math.round((miss / total) * 100),    color: HIT_COLORS.miss },
      ]
    }

    let home = 0, away = 0, draw = 0
    for (const t of allSeasonTips) {
      const d = t.homeScore - t.awayScore
      if (d > 0) home++; else if (d < 0) away++; else draw++
    }
    const riskTotal = home + away + draw
    if (riskTotal > 0) {
      risk = {
        home: Math.round((home / riskTotal) * 100),
        away: Math.round((away / riskTotal) * 100),
        draw: Math.round((draw / riskTotal) * 100),
      }
    }

    const pointsByMatchdayId: Record<string, number> = {}
    for (const t of allSeasonTips) {
      const mdId = t.match.matchdayId
      pointsByMatchdayId[mdId] = (pointsByMatchdayId[mdId] ?? 0) + (t.points ?? 0)
    }

    for (const md of allCompletedMatchdays) {
      const pts = pointsByMatchdayId[md.id] ?? 0
      if (!record || pts > record.points)
        record = { points: pts, matchdayNumber: md.matchdayNumber }
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

  return (
    <div className="max-w-3xl space-y-4">

      {/* ── Hero card ── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div
          className="h-28 w-full"
          style={{
            background: user.color
              ? `linear-gradient(135deg, ${user.color}cc 0%, ${user.color}33 100%)`
              : 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 40%, transparent) 100%)',
          }}
        />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div
              className="h-20 w-20 rounded-2xl shrink-0 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white/20"
              style={{ backgroundColor: user.color ?? 'var(--color-primary)' }}
            >
              {initials}
            </div>
            {isMe && (
              <Link
                href="/profil"
                className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                Bearbeiten
              </Link>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {user.nickname}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user.name}</p>

          {club ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={club.iconUrl} alt="" className="h-5 w-5 object-contain shrink-0" />
              <span className="font-medium text-foreground">{club.name}</span>
              <span className="text-xs text-muted-foreground">BL{club.league}</span>
            </div>
          ) : user.favoriteTeam ? (
            <p className="mt-3 text-sm text-foreground">{user.favoriteTeam}</p>
          ) : null}
        </div>
      </div>

      {/* ── Season stats ── */}
      {activeSeason && (
        <>
          <p className="text-xs text-muted-foreground uppercase tracking-widest px-0.5">
            Saison {activeSeason.year}/{parseInt(activeSeason.year) + 1}
          </p>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={<IconTrophy className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Saisonpunkte"
              value={seasonTotal}
              highlight
            />
            <KpiCard
              icon={<IconMedal className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Rang"
              value={rank > 0 ? `${rank}.` : '–'}
            />
            <KpiCard
              icon={<IconChartBar className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Ø / Spieltag"
              value={avgPerMatchday}
            />
            <KpiCard
              icon={<IconFlame className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Rekord"
              value={record ? `${record.points}P` : '–'}
              sub={record && record.points > 0 ? `Spieltag ${record.matchdayNumber}` : undefined}
            />
            <KpiCard
              icon={<IconTarget className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Exakt"
              value={total > 0 ? `${exactPct}%` : '–'}
            />
            <KpiCard
              icon={<IconBallFootball className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Getippt"
              value={total}
            />
          </div>

          {/* Risikofaktor */}
          <div className="glass rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <IconScale className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Risikofaktor</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary font-medium">
                Heim {risk.home}%
              </span>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent font-medium">
                Auswärts {risk.away}%
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground font-medium">
                Unentsch. {risk.draw}%
              </span>
            </div>
          </div>

          {/* Charts */}
          <PlayerCharts lineData={lineData} pieData={pieData} />
        </>
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
    <div className="glass rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn(
        'text-2xl font-bold tabular-nums leading-none',
        highlight ? 'text-primary' : 'text-foreground',
      )}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
