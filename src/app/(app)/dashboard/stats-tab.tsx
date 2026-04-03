'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { listStagger, panelEnter } from '@/lib/motion'
import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { IconChartBar, IconTrophy, IconScale, IconPokerChip } from '@/components/app-icons'

/* ── Exported types (used in page.tsx) ── */

export interface SeasonTipEntry {
  userId: string
  homeScore: number
  awayScore: number
  points: number | null
  isJoker: boolean
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
  isJoker: boolean
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
// Fallback palette (used when a user has no chosen color) – mirrors the brand palette
const CHART_COLORS = [
  '#1d4ed8',
  '#3b82f6',
  '#60a5fa',
  '#94a3b8',
  '#64748b',
  '#dc2626',
  '#2563eb',
  '#475569',
]

const HIT_COLORS = {
  exact:   '#1d4ed8',
  diff:    '#3b82f6',
  outcome: '#93c5fd',
  miss:    '#9ca3af',
}

const JOKER_COLORS = {
  fail: '#9ca3af',
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

function normalizeHexColor(color: string | null | undefined) {
  if (!color) return null
  const value = color.trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
  }
  return null
}

function mixHexColor(baseColor: string, target: string, weight: number) {
  const base = normalizeHexColor(baseColor)
  const mixTarget = normalizeHexColor(target)
  if (!base || !mixTarget) return baseColor

  const mixChannel = (baseStart: number, targetStart: number) => {
    const baseValue = parseInt(base.slice(baseStart, baseStart + 2), 16)
    const targetValue = parseInt(mixTarget.slice(targetStart, targetStart + 2), 16)
    return Math.round(baseValue * (1 - weight) + targetValue * weight)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${mixChannel(1, 1)}${mixChannel(3, 3)}${mixChannel(5, 5)}`
}

function getJokerSuccessColors(baseColor: string) {
  return {
    outcome: mixHexColor(baseColor, '#ffffff', 0.45),
    diff: mixHexColor(baseColor, '#ffffff', 0.2),
    exact: mixHexColor(baseColor, '#000000', 0.12),
  }
}

function buildJokerBreakdownData({
  miss,
  outcome,
  diff,
  exact,
  color,
}: {
  miss: number
  outcome: number
  diff: number
  exact: number
  color: string
}) {
  const total = miss + outcome + diff + exact
  if (!total) return []
  const successColors = getJokerSuccessColors(color)
  return [
    { key: 'miss', name: 'Erfolglos (0P)', value: miss, pct: Math.round((miss / total) * 100), color: JOKER_COLORS.fail },
    { key: 'outcome', name: 'Tendenz (4P)', value: outcome, pct: Math.round((outcome / total) * 100), color: successColors.outcome },
    { key: 'diff', name: 'Differenz (6P)', value: diff, pct: Math.round((diff / total) * 100), color: successColors.diff },
    { key: 'exact', name: 'Exakt (8P)', value: exact, pct: Math.round((exact / total) * 100), color: successColors.exact },
  ].filter((entry) => entry.value > 0)
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

function getAccuracyBucket(points: number | null, isJoker: boolean) {
  if (points === null) return null
  const basePoints = isJoker && points > 0 ? points / 2 : points
  if (basePoints === 4) return 'exact'
  if (basePoints === 3) return 'diff'
  if (basePoints === 2) return 'outcome'
  return 'miss'
}

function getBasePoints(points: number | null, isJoker: boolean) {
  if (points === null) return 0
  return isJoker && points > 0 ? points / 2 : points
}

/* ── Sub-components (module-level to prevent remounting on parent re-render) ── */

function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  const shouldReduce = useReducedMotion()
  useEffect(() => {
    if (shouldReduce) { setVal(to); return }
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      setVal(Math.round((1 - (1 - p) ** 3) * to * 10) / 10)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to, duration, shouldReduce])
  return <>{val}</>
}

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
    <div className="surface flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 px-4 py-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground">
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      </div>
      <div className="flex flex-1 flex-col">
        <p className="text-[2rem] font-bold leading-none tabular-nums text-foreground">
        {typeof value === 'number' ? <CountUp to={value} /> : value}
        </p>
        <div className="mt-auto pt-4">
          {sub ? (
            <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground font-sans truncate">{sub}</p>
            </div>
          ) : (
            <div className="h-[2.625rem] rounded-xl border border-border/60 bg-background/65" />
          )}
        </div>
      </div>
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
  const [selectedJokerUserId, setSelectedJokerUserId] = useState(currentUserId)

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
      const bucket = getAccuracyBucket(tip.points, tip.isJoker)
      if (bucket === 'exact') exact++
      else if (bucket === 'diff') diff++
      else if (bucket === 'outcome') outcome++
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

  const matchdayJokers = useMemo(() => {
    const byUser = Object.fromEntries(
      users.map((u) => [u.id, { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 }]),
    ) as Record<string, { used: number; hit: number; bonus: number; miss: number; outcome: number; diff: number; exact: number }>

    for (const match of matchday.matches) {
      for (const u of users) {
        const tip = tipIndex[match.id]?.[u.id]
        if (!tip?.isJoker || tip.points === null) continue
        const basePoints = getBasePoints(tip.points, tip.isJoker)
        byUser[u.id].used += 1
        if (tip.points === 8) byUser[u.id].exact += 1
        else if (tip.points === 6) byUser[u.id].diff += 1
        else if (tip.points === 4) byUser[u.id].outcome += 1
        else byUser[u.id].miss += 1
        if (basePoints > 0) byUser[u.id].hit += 1
        byUser[u.id].bonus += Math.max(0, (tip.points ?? 0) - basePoints)
      }
    }

    const summary = Object.values(byUser).reduce(
      (acc, entry) => ({
        used: acc.used + entry.used,
        hit: acc.hit + entry.hit,
        bonus: acc.bonus + entry.bonus,
        miss: acc.miss + entry.miss,
        outcome: acc.outcome + entry.outcome,
        diff: acc.diff + entry.diff,
        exact: acc.exact + entry.exact,
      }),
      { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 },
    )

    return { byUser, summary }
  }, [users, matchday.matches, tipIndex])

  /* ── Saison-scope calculations (memoized independently of view) ── */
  const seasonData = useMemo(() => {
    const accuracy = users.map((u) => {
      let exact = 0, diff = 0, outcome = 0, miss = 0
      for (const md of seasonStats) {
        for (const tip of md.tips) {
          if (tip.userId !== u.id || tip.points === null) continue
          const bucket = getAccuracyBucket(tip.points, tip.isJoker)
          if (bucket === 'exact') exact++
          else if (bucket === 'diff') diff++
          else if (bucket === 'outcome') outcome++
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

    const jokerByUser = Object.fromEntries(
      users.map((u) => [u.id, { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 }]),
    ) as Record<string, { used: number; hit: number; bonus: number; miss: number; outcome: number; diff: number; exact: number }>

    for (const md of seasonStats) {
      for (const tip of md.tips) {
        if (!tip.isJoker || tip.points === null) continue
        const basePoints = getBasePoints(tip.points, tip.isJoker)
        jokerByUser[tip.userId].used += 1
        if (tip.points === 8) jokerByUser[tip.userId].exact += 1
        else if (tip.points === 6) jokerByUser[tip.userId].diff += 1
        else if (tip.points === 4) jokerByUser[tip.userId].outcome += 1
        else jokerByUser[tip.userId].miss += 1
        if (basePoints > 0) jokerByUser[tip.userId].hit += 1
        jokerByUser[tip.userId].bonus += Math.max(0, (tip.points ?? 0) - basePoints)
      }
    }

    const jokerSummary = Object.values(jokerByUser).reduce(
      (acc, entry) => ({
        used: acc.used + entry.used,
        hit: acc.hit + entry.hit,
        bonus: acc.bonus + entry.bonus,
        miss: acc.miss + entry.miss,
        outcome: acc.outcome + entry.outcome,
        diff: acc.diff + entry.diff,
        exact: acc.exact + entry.exact,
      }),
      { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 },
    )

    return { accuracy, avg, record, risk, formkurve, lineData, barData, jokerByUser, jokerSummary }
  }, [seasonStats, users, seasonPointsMap])

  /* ── Derived display values ── */
  const activeAccuracy = view === 'spieltag' ? matchdayAccuracy : seasonData.accuracy
  const pieData = useMemo(() => buildPieData(activeAccuracy), [activeAccuracy])
  const activeRisk = view === 'spieltag' ? mdKpis.risk : seasonData.risk
  const activeJokers = view === 'spieltag' ? matchdayJokers : {
    byUser: seasonData.jokerByUser,
    summary: seasonData.jokerSummary,
  }
  const jokerUserOptions = users.map((u) => ({
    id: u.id,
    nickname: u.nickname,
    color: userColorMap.get(u.id) ?? CHART_COLORS[0],
  }))
  const effectiveJokerUserId =
    jokerUserOptions.some((u) => u.id === selectedJokerUserId)
      ? selectedJokerUserId
      : (jokerUserOptions.find((u) => u.id === currentUserId)?.id ?? jokerUserOptions[0]?.id ?? '')
  const selectedJokerUser = jokerUserOptions.find((u) => u.id === effectiveJokerUserId) ?? null
  const selectedJokerStats = effectiveJokerUserId
    ? activeJokers.byUser[effectiveJokerUserId] ?? { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 }
    : { used: 0, hit: 0, bonus: 0, miss: 0, outcome: 0, diff: 0, exact: 0 }
  const jokerBreakdownData = useMemo(
    () => buildJokerBreakdownData({
      miss: selectedJokerStats.miss,
      outcome: selectedJokerStats.outcome,
      diff: selectedJokerStats.diff,
      exact: selectedJokerStats.exact,
      color: selectedJokerUser?.color ?? CHART_COLORS[0],
    }),
    [
      selectedJokerStats.miss,
      selectedJokerStats.outcome,
      selectedJokerStats.diff,
      selectedJokerStats.exact,
      selectedJokerUser?.color,
    ],
  )

  useEffect(() => {
    if (!jokerUserOptions.length) return
    if (!jokerUserOptions.some((u) => u.id === selectedJokerUserId)) {
      setSelectedJokerUserId(jokerUserOptions.find((u) => u.id === currentUserId)?.id ?? jokerUserOptions[0].id)
    }
  }, [currentUserId, jokerUserOptions, selectedJokerUserId])

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
        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          variants={listStagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={panelEnter} className="h-full">
            <KpiCard
              icon={<IconChartBar className="h-3.5 w-3.5" strokeWidth={1} />}
              label="Ø Punkte"
              value={view === 'spieltag' ? mdKpis.avg : seasonData.avg}
              sub={view === 'saison' ? 'pro Spieltag' : undefined}
            />
          </motion.div>
          <motion.div variants={panelEnter} className="h-full">
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
          </motion.div>
          {/* Risikofaktor */}
          <motion.div variants={panelEnter} className="h-full">
            <div className="surface flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 px-4 py-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground">
                  <IconScale className="h-3.5 w-3.5" strokeWidth={1} />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Risikofaktor
                </p>
              </div>
              <div className="mt-auto grid gap-2">
                <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-sans">
                    <span className="font-medium text-primary">Heim</span>
                    <span className="font-semibold tabular-nums text-primary">{activeRisk.home}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${activeRisk.home}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-sans">
                    <span className="font-medium text-accent">Auswärts</span>
                    <span className="font-semibold tabular-nums text-accent">{activeRisk.away}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-accent/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${activeRisk.away}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-sans">
                    <span className="font-medium text-muted-foreground">Unentsch.</span>
                    <span className="font-semibold tabular-nums text-muted-foreground">{activeRisk.draw}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-muted-foreground/70" style={{ width: `${activeRisk.draw}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div variants={panelEnter} className="h-full">
            <KpiCard
              icon={<IconPokerChip className="h-3.5 w-3.5 text-amber-500" strokeWidth={1} />}
              label="Joker-Bonus"
              value={`+${activeJokers.summary.bonus}`}
              sub={
                activeJokers.summary.used > 0
                  ? `${activeJokers.summary.used} gesetzt · ${activeJokers.summary.hit} erfolgreich`
                  : 'Noch kein Joker gesetzt'
              }
            />
          </motion.div>
        </motion.div>
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

      {(pieData.length > 0 || selectedJokerUser) && (
        <div className="grid gap-4 xl:grid-cols-2">
          {pieData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">
                Treffer-Verteilung
              </h3>
              <div className="space-y-3">
                {pieData.map((entry) => (
                  <div key={entry.name} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex items-center gap-2 text-xs font-sans">
                        <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
                        <span className="truncate text-foreground">{entry.name}</span>
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
            </div>
          )}

          {selectedJokerUser && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                    Joker-Verteilung
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-sans">
                    Auswertung fur {selectedJokerUser.nickname} im aktuellen View
                  </p>
                </div>
                <Select value={effectiveJokerUserId} onValueChange={setSelectedJokerUserId}>
                  <SelectTrigger className="h-9 w-full sm:w-48">
                    <SelectValue placeholder="Nutzer waehlen" />
                  </SelectTrigger>
                  <SelectContent>
                    {jokerUserOptions.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nickname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {jokerBreakdownData.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/70 bg-secondary/35 p-3">
                    <div className="flex h-6 overflow-hidden rounded-full bg-muted">
                      {jokerBreakdownData.map((entry) => (
                        <div
                          key={entry.key}
                          className="h-full transition-[width]"
                          style={{
                            width: `${entry.pct}%`,
                            backgroundColor: entry.color,
                          }}
                          title={`${entry.name}: ${entry.value} (${entry.pct}%)`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {jokerBreakdownData.map((entry) => (
                      <div key={entry.key} className="flex items-center gap-2 text-xs font-sans">
                        <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-foreground">{entry.name}</span>
                        <span className="ml-auto tabular-nums text-muted-foreground">{entry.value}</span>
                        <span className="w-12 text-right tabular-nums text-muted-foreground">{entry.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-border/70 bg-secondary/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Gesetzt</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{selectedJokerStats.used}</p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-secondary/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Bonus</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-foreground">+{selectedJokerStats.bonus}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border/70 bg-secondary/35 px-6 text-center">
                  <p className="text-sm text-muted-foreground font-sans">
                    {selectedJokerUser.nickname} hat in dieser Ansicht noch keinen Joker gesetzt.
                  </p>
                </div>
              )}
            </div>
          )}
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
                <TableHead className="text-center uppercase tracking-wide text-xs">Joker</TableHead>
                <TableHead className="text-right uppercase tracking-wide text-xs">Bonus</TableHead>
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
                const joker = activeJokers.byUser[user.id] ?? { used: 0, hit: 0, bonus: 0 }
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
                    <TableCell className="text-center tabular-nums">
                      {joker.used > 0 ? `${joker.hit}/${joker.used}` : '–'}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {joker.bonus > 0 ? `+${joker.bonus}` : '–'}
                    </TableCell>
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
          {view === 'saison' && (
            <div className="border-t border-border/70 px-4 py-3">
              <p className="text-xs text-muted-foreground font-sans">
                Joker zeigt <span className="font-medium text-foreground">erfolgreich / gesetzt</span>. Beispiel:{' '}
                <span className="font-medium text-foreground">13/17</span> bedeutet 17 Joker gesetzt, davon 13 erfolgreich.
                Bonus sind die zusätzlichen Punkte, die nur durch den Joker entstanden sind.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
