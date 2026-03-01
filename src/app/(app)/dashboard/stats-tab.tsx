'use client'

import { useMemo, useCallback, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { IconChartBar, IconTrophy, IconScale } from '@tabler/icons-react'

/* ── Exported types (used in page.tsx) ── */

export interface SeasonTipEntry {
  userId: string
  homeScore: number
  awayScore: number
  points: number | null
}

export interface SeasonMatchdayStat {
  matchdayNumber: number
  pointsPerUser: Record<string, number>
  tips: SeasonTipEntry[]
}

/* ── Internal types ── */

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  matchDate: Date
  status: string
}

interface Matchday {
  id: string
  matchdayNumber: number
  status: string
  tippDeadline: Date
  season: { year: string }
  matches: Match[]
}

interface User {
  id: string
  nickname: string
  name: string
  favoriteTeam: string | null
  color: string | null
}

interface TipEntry {
  homeScore: number
  awayScore: number
  points: number | null
}

interface Props {
  matchday: Matchday
  users: User[]
  tipIndex: Record<string, Record<string, TipEntry>>
  matchdayPointsMap: Record<string, number>
  seasonPointsMap: Record<string, number>
  seasonStats: SeasonMatchdayStat[]
  currentUserId: string
}

/* ── Constants ── */

// Hex values required since Recharts SVG doesn't support CSS variables
const CHART_COLORS = [
  '#2a61a1', '#e20613', '#c8920a', '#2d7a45',
  '#c97117', '#7b3fb5', '#0d9488', '#db2777',
]

const HIT_COLORS = {
  exact:   '#2a61a1',
  diff:    '#4a80c0',
  outcome: '#93afd4',
  miss:    '#94a3b8',
}

const TICK_STYLE = { fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' } as const

/* ── Helper functions (module-level, no closure over component state) ── */

function computeRiskFactor(tips: Array<{ homeScore: number; awayScore: number }>) {
  let home = 0, away = 0, draw = 0
  for (const t of tips) {
    const d = t.homeScore - t.awayScore
    if (d > 0) home++; else if (d < 0) away++; else draw++
  }
  const total = home + away + draw
  if (!total) return { home: 0, away: 0, draw: 0 }
  return {
    home: Math.round((home / total) * 100),
    away: Math.round((away / total) * 100),
    draw: Math.round((draw / total) * 100),
  }
}

function buildPieData(
  accuracy: Array<{ exact: number; diff: number; outcome: number; miss: number }>,
) {
  const t = accuracy.reduce(
    (a, r) => ({
      exact: a.exact + r.exact,
      diff: a.diff + r.diff,
      outcome: a.outcome + r.outcome,
      miss: a.miss + r.miss,
    }),
    { exact: 0, diff: 0, outcome: 0, miss: 0 },
  )
  const total = t.exact + t.diff + t.outcome + t.miss
  if (!total) return []
  return [
    { name: 'Exakt (4P)',     value: t.exact,   pct: Math.round((t.exact / total) * 100),   color: HIT_COLORS.exact },
    { name: 'Differenz (3P)', value: t.diff,    pct: Math.round((t.diff / total) * 100),    color: HIT_COLORS.diff },
    { name: 'Tendenz (2P)',   value: t.outcome, pct: Math.round((t.outcome / total) * 100), color: HIT_COLORS.outcome },
    { name: 'Falsch (0P)',    value: t.miss,    pct: Math.round((t.miss / total) * 100),    color: HIT_COLORS.miss },
  ]
}

function buildLineData(seasonStats: SeasonMatchdayStat[], users: User[]) {
  const running: Record<string, number> = {}
  return seasonStats.map((md) => {
    const entry: Record<string, number | string> = { st: `ST ${md.matchdayNumber}` }
    for (const u of users) {
      running[u.id] = (running[u.id] ?? 0) + (md.pointsPerUser[u.id] ?? 0)
      entry[u.id] = running[u.id]
    }
    return entry
  })
}

/* ── Sub-components (module-level to prevent remounting on parent re-render) ── */

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon?: React.ReactNode
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground font-sans truncate">{sub}</p>}
    </div>
  )
}

// Recharts clones the `content` element and injects { active, payload, label } — userMap is forwarded via props
function ChartTooltipContent({
  active,
  payload,
  label,
  userMap,
}: {
  active?: boolean
  payload?: Array<{ name: string; color: string; value: number }>
  label?: string
  userMap: Map<string, string>
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs font-sans">
      {label && (
        <p className="mb-1 font-bold uppercase tracking-wide">{label}</p>
      )}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="text-muted-foreground">{userMap.get(e.name) ?? e.name}</span>
          <span className="ml-auto font-semibold tabular-nums">{e.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Main component ── */

export function StatsTab({
  matchday,
  users,
  tipIndex,
  matchdayPointsMap,
  seasonPointsMap,
  seasonStats,
  currentUserId,
}: Props) {
  const [view, setView] = useState<'spieltag' | 'saison'>('spieltag')

  // Per-user chart color: prefer user's chosen color, fall back to CHART_COLORS by index
  const userColorMap = useMemo(
    () => new Map(users.map((u, i) => [u.id, u.color ?? CHART_COLORS[i % CHART_COLORS.length]])),
    [users],
  )

  // O(1) lookups for chart formatters
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.nickname])), [users])
  const legendFormatter = useCallback((value: string) => userMap.get(value) ?? value, [userMap])

  // Tooltip element — stable reference since ChartTooltipContent is module-level and userMap is memoized
  const tooltipContent = useMemo(() => <ChartTooltipContent userMap={userMap} />, [userMap])

  /* ── Spieltag-scope calculations ── */
  const matchdayAccuracy = useMemo(() => users.map((u) => {
    let exact = 0, diff = 0, outcome = 0, miss = 0
    for (const match of matchday.matches) {
      const tip = tipIndex[match.id]?.[u.id]
      if (!tip || tip.points === null) continue
      if (tip.points === 4) exact++
      else if (tip.points === 3) diff++
      else if (tip.points === 2) outcome++
      else miss++
    }
    return { user: u, exact, diff, outcome, miss }
  }), [users, matchday.matches, tipIndex])

  const mdKpis = useMemo(() => {
    const tippingUsers = users.filter((u) => matchdayPointsMap[u.id] !== undefined)
    const avg =
      tippingUsers.length > 0
        ? Math.round(
            (tippingUsers.reduce((s, u) => s + (matchdayPointsMap[u.id] ?? 0), 0) /
              tippingUsers.length) * 10,
          ) / 10
        : 0
    const best = users.reduce<{ nickname: string; points: number } | null>((b, u) => {
      const pts = matchdayPointsMap[u.id] ?? 0
      return !b || pts > b.points ? { nickname: u.nickname, points: pts } : b
    }, null)
    const risk = computeRiskFactor(
      matchday.matches.flatMap((m) =>
        users.map((u) => tipIndex[m.id]?.[u.id]).filter(Boolean) as TipEntry[],
      ),
    )
    return { avg, best, risk }
  }, [users, matchday.matches, tipIndex, matchdayPointsMap])

  /* ── Saison-scope calculations (memoized independently of view) ── */
  const seasonData = useMemo(() => {
    const accuracy = users.map((u) => {
      let exact = 0, diff = 0, outcome = 0, miss = 0
      for (const md of seasonStats) {
        for (const tip of md.tips) {
          if (tip.userId !== u.id || tip.points === null) continue
          if (tip.points === 4) exact++
          else if (tip.points === 3) diff++
          else if (tip.points === 2) outcome++
          else miss++
        }
      }
      return { user: u, exact, diff, outcome, miss }
    })

    const completedCount = seasonStats.length
    const snTippingUsers = users.filter((u) => seasonPointsMap[u.id] !== undefined)
    const avg =
      snTippingUsers.length > 0 && completedCount > 0
        ? Math.round(
            (snTippingUsers.reduce((s, u) => s + (seasonPointsMap[u.id] ?? 0), 0) /
              snTippingUsers.length / completedCount) * 10,
          ) / 10
        : 0

    let record: { nickname: string; points: number; matchdayNumber: number } | null = null
    for (const md of seasonStats) {
      for (const u of users) {
        const pts = md.pointsPerUser[u.id] ?? 0
        if (!record || pts > record.points)
          record = { nickname: u.nickname, points: pts, matchdayNumber: md.matchdayNumber }
      }
    }

    const risk = computeRiskFactor(seasonStats.flatMap((md) => md.tips))

    const last3 = seasonStats.slice(-3)
    const prev3 = seasonStats.slice(-6, -3)
    const formkurve: Record<string, { sum: number; trend: 'up' | 'down' | 'flat' }> = {}
    for (const u of users) {
      const recent = last3.reduce((s, md) => s + (md.pointsPerUser[u.id] ?? 0), 0)
      const prior = prev3.reduce((s, md) => s + (md.pointsPerUser[u.id] ?? 0), 0)
      formkurve[u.id] = {
        sum: recent,
        trend: recent > prior ? 'up' : recent < prior ? 'down' : 'flat',
      }
    }

    const lineData = buildLineData(seasonStats, users)
    const barData = seasonStats.slice(-8).map((md) => {
      const entry: Record<string, number | string> = { st: String(md.matchdayNumber) }
      for (const u of users) entry[u.id] = md.pointsPerUser[u.id] ?? 0
      return entry
    })

    return { accuracy, avg, record, risk, formkurve, lineData, barData }
  }, [seasonStats, users, seasonPointsMap])

  /* ── Derived display values ── */
  const activeAccuracy = view === 'spieltag' ? matchdayAccuracy : seasonData.accuracy
  const pieData = useMemo(() => buildPieData(activeAccuracy), [activeAccuracy])
  const activeRisk = view === 'spieltag' ? mdKpis.risk : seasonData.risk

  return (
    <div className="space-y-5">

      {/* ── Toggle ── */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5 w-fit">
        {(['spieltag', 'saison'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'rounded-md px-3 py-1 text-xs uppercase tracking-wide transition-all',
              view === v
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {v === 'spieltag' ? 'Spieltag' : 'Saison'}
          </button>
        ))}
      </div>

      {/* ── Leer-Zustand ── */}
      {view === 'saison' && seasonStats.length === 0 && (
        <div className="rounded-lg border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground font-sans">
            Noch keine abgeschlossenen Spieltage in dieser Saison.
          </p>
        </div>
      )}

      {/* ── KPI-Karten ── */}
      {(view === 'spieltag' || seasonStats.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            icon={<IconChartBar className="h-3.5 w-3.5" strokeWidth={1} />}
            label="Ø Punkte"
            value={view === 'spieltag' ? mdKpis.avg : seasonData.avg}
            sub={view === 'saison' ? 'pro Spieltag' : undefined}
          />
          <KpiCard
            icon={<IconTrophy className="h-3.5 w-3.5" strokeWidth={1} />}
            label="Rekord"
            value={
              view === 'spieltag'
                ? mdKpis.best ? `${mdKpis.best.points}P` : '–'
                : seasonData.record ? `${seasonData.record.points}P` : '–'
            }
            sub={
              view === 'spieltag'
                ? (mdKpis.best && mdKpis.best.points > 0 ? mdKpis.best.nickname : undefined)
                : seasonData.record
                  ? `${seasonData.record.nickname} · ST ${seasonData.record.matchdayNumber}`
                  : undefined
            }
          />
          {/* Risikofaktor */}
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-muted-foreground"><IconScale className="h-3.5 w-3.5" strokeWidth={1} /></span>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Risikofaktor
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-sans text-primary font-medium">
                Heim {activeRisk.home}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-sans text-accent font-medium">
                Auswärts {activeRisk.away}%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-sans text-muted-foreground font-medium">
                Unentsch. {activeRisk.draw}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Saison-Verlauf LineChart ── */}
      {view === 'saison' && seasonStats.length > 1 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
            Saison-Verlauf
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={seasonData.lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="st" tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip content={tooltipContent} />
              <Legend formatter={legendFormatter} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
              {users.map((u) => (
                <Line
                  key={u.id}
                  type="monotone"
                  dataKey={u.id}
                  name={u.id}
                  stroke={userColorMap.get(u.id)}
                  strokeWidth={u.id === currentUserId ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Treffer-Verteilung PieChart ── */}
      {pieData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
            Treffer-Verteilung
          </h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <PieChart width={180} height={180}>
              <Pie data={pieData} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof pieData)[0]
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs font-sans">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-muted-foreground">{d.value} Tipps · {d.pct}%</p>
                    </div>
                  )
                }}
              />
            </PieChart>
            <div className="flex flex-col gap-2">
              {pieData.map((e) => (
                <div key={e.name} className="flex items-center gap-2 text-xs font-sans">
                  <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-foreground">{e.name}</span>
                  <span className="ml-auto tabular-nums text-muted-foreground pl-4">{e.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Punkte/Spieltag BarChart ── */}
      {view === 'saison' && seasonData.barData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
            Punkte / Spieltag (letzte {seasonData.barData.length})
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={seasonData.barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="st" tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip content={tooltipContent} />
              <Legend formatter={legendFormatter} wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-sans)' }} />
              {users.map((u) => (
                <Bar
                  key={u.id}
                  dataKey={u.id}
                  name={u.id}
                  fill={userColorMap.get(u.id)}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Accuracy-Tabelle ── */}
      {(view === 'spieltag' || seasonStats.length > 0) && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wide text-xs">Nutzer</TableHead>
                <TableHead className="text-center uppercase tracking-wide text-xs">Exakt</TableHead>
                <TableHead className="text-center uppercase tracking-wide text-xs">Differenz</TableHead>
                <TableHead className="text-center uppercase tracking-wide text-xs">Tendenz</TableHead>
                <TableHead className="text-center uppercase tracking-wide text-xs">Falsch</TableHead>
                <TableHead className="text-right uppercase tracking-wide text-xs">Quote</TableHead>
                {view === 'saison' && (
                  <TableHead className="text-center uppercase tracking-wide text-xs">Form</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAccuracy.map(({ user, exact, diff, outcome, miss }) => {
                const total = exact + diff + outcome + miss
                const rate = total > 0 ? Math.round(((exact + diff + outcome) / total) * 100) : 0
                const form = seasonData.formkurve[user.id]
                return (
                  <TableRow key={user.id} className={user.id === currentUserId ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium font-sans">
                      <Link
                        href={`/spieler/${user.nickname}`}
                        className={cn(
                          'hover:underline underline-offset-4 transition-colors',
                          user.id === currentUserId ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {user.nickname}
                      </Link>
                      {user.id === currentUserId && (
                        <span className="ml-1 text-xs text-muted-foreground">(du)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{exact}</TableCell>
                    <TableCell className="text-center tabular-nums">{diff}</TableCell>
                    <TableCell className="text-center tabular-nums">{outcome}</TableCell>
                    <TableCell className="text-center tabular-nums">{miss}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{rate}%</TableCell>
                    {view === 'saison' && form && (
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'text-xs font-sans tabular-nums whitespace-nowrap',
                            form.trend === 'up' && 'text-emerald-500',
                            form.trend === 'down' && 'text-destructive',
                            form.trend === 'flat' && 'text-muted-foreground',
                          )}
                        >
                          {form.sum}{' '}
                          {form.trend === 'up' ? '↑' : form.trend === 'down' ? '↓' : '→'}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
