'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { StandingsTable } from './standings-table'
import { StatsTab } from './stats-tab'
import type { SeasonMatchdayStat } from './stats-tab'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { layoutSpring, listStagger, panelEnter, pageEnter, popIn, normal } from '@/lib/motion'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconTrophy,
  IconMedal,
  IconBallFootball,
  IconTable,
  IconChartBar,
  IconPokerChip,
  IconLock,
} from '@/components/app-icons'

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
  deadlinePassed: boolean
  matchdayList: { matchdayNumber: number }[]
}

/* Points badge with pop animation for ≥2P */
function PointsBadge({ points, isJoker = false }: { points: number | null; isJoker?: boolean }) {
  const shouldReduce = useReducedMotion()
  if (points === null) return <span className="text-muted-foreground text-xs">–</span>
  const value = points
  const className = cn(
    'inline-flex h-7 min-w-[1.85rem] items-center justify-center rounded-xl border px-2 text-xs font-bold tabular-nums shadow-sm',
    !isJoker && value === 4 && 'border-blue-700 bg-blue-700 text-white',
    !isJoker && value === 3 && 'border-blue-600 bg-blue-600 text-white',
    !isJoker && value === 2 && 'border-blue-300 bg-blue-300/20 text-blue-300',
    value === 0 && 'border-gray-500/35 bg-gray-500/12 text-gray-300',
    isJoker && value === 8 && 'border-amber-400 bg-amber-400 text-gray-950',
    isJoker && value === 6 && 'border-amber-500 bg-amber-500/80 text-gray-950',
    isJoker && value === 4 && 'border-amber-300 bg-amber-300/20 text-amber-300',
  )
  if (value >= 2) {
    return (
      <motion.span
        className={className}
        variants={popIn}
        initial="hidden"
        animate="show"
        transition={shouldReduce ? { duration: 0 } : undefined}
      >
        {points}
      </motion.span>
    )
  }
  return <span className={className}>{points}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot?: boolean }> = {
    ACTIVE:    { label: 'Aktiv', cls: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', dot: true },
    UPCOMING:  { label: 'Ausstehend', cls: 'border border-border/70 bg-secondary text-muted-foreground' },
    CLOSED:    { label: 'Geschlossen', cls: 'border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    COMPLETED: { label: 'Abgeschlossen', cls: 'border border-border/70 bg-secondary text-muted-foreground' },
  }
  const { label, cls, dot } = map[status] ?? { label: status, cls: '' }
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', cls)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </span>
  )
}

/* Rank indicator with medals for top 3 */
function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <IconTrophy className="h-4 w-4 text-yellow-500" strokeWidth={1.5} />
  if (rank === 1) return <IconMedal className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
  if (rank === 2) return <IconMedal className="h-4 w-4 text-amber-700" strokeWidth={1.5} />
  return <span className="text-sm font-bold tabular-nums text-muted-foreground">{rank + 1}.</span>
}

/* ── Animated Tab Pill ── */
type TabValue = 'spiele' | 'tabelle' | 'stats'
type PlaySubtabValue = 'matches' | 'tips'
type TipsSortKey = 'matchDate' | 'fixture' | 'result'
type SortDirection = 'asc' | 'desc'

const tabDefs: { value: TabValue; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  { value: 'spiele',  label: 'Spiele & Tipps', mobileLabel: 'Spiele',     icon: <IconBallFootball className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'tabelle', label: 'Bundesliga',      mobileLabel: 'Bundesliga', icon: <IconTable       className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'stats',   label: 'Statistiken',     mobileLabel: 'Stats',      icon: <IconChartBar    className="h-3.5 w-3.5" strokeWidth={1.5} /> },
]

const playSubtabs: { value: PlaySubtabValue; label: string }[] = [
  { value: 'matches', label: 'Spiele' },
  { value: 'tips', label: 'Tipps' },
]

function AnimatedTabsList({
  tabs,
  value,
  onChange,
}: {
  tabs: typeof tabDefs
  value: TabValue
  onChange: (v: TabValue) => void
}) {
  return (
    <div role="tablist" className="relative mb-4 grid grid-cols-3 rounded-2xl border border-border/70 bg-secondary/80 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative z-10 flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors sm:gap-1.5 sm:px-3 sm:text-xs sm:tracking-[0.12em]',
            value === tab.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === tab.value && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 rounded-xl bg-background shadow-sm"
              transition={layoutSpring}
            />
          )}
          <span className="relative z-10">{tab.icon}</span>
          <span className="relative z-10 min-w-0 truncate sm:hidden">{tab.mobileLabel}</span>
          <span className="relative z-10 hidden min-w-0 truncate sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export function DashboardContent({
  matchday,
  users,
  tipIndex,
  matchdayPointsMap,
  seasonPointsMap,
  seasonStats,
  currentUserId,
  deadlinePassed,
  matchdayList,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>('spiele')
  const [playSubtab, setPlaySubtab] = useState<PlaySubtabValue>('matches')
  const [tipsSortKey, setTipsSortKey] = useState<TipsSortKey>('matchDate')
  const [tipsSortDirection, setTipsSortDirection] = useState<SortDirection>('asc')
  const shouldReduce = useReducedMotion()

  const sortedMatchdays = [...matchdayList].sort((a, b) => a.matchdayNumber - b.matchdayNumber)
  const currentIndex = sortedMatchdays.findIndex((m) => m.matchdayNumber === matchday.matchdayNumber)
  const prevMd = currentIndex > 0 ? sortedMatchdays[currentIndex - 1].matchdayNumber : null
  const nextMd = currentIndex < sortedMatchdays.length - 1 ? sortedMatchdays[currentIndex + 1].matchdayNumber : null

  const sortedBySeason = [...users].sort(
    (a, b) => (seasonPointsMap[b.id] ?? 0) - (seasonPointsMap[a.id] ?? 0),
  )
  const matrixUsers = [
    ...users.filter((user) => user.id === currentUserId),
    ...sortedBySeason.filter((user) => user.id !== currentUserId),
  ]

  function toggleTipsSort(key: TipsSortKey) {
    if (tipsSortKey === key) {
      setTipsSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setTipsSortKey(key)
    setTipsSortDirection(key === 'matchDate' ? 'asc' : 'desc')
  }

  return (
    <div className="space-y-6">

      <motion.div
        variants={pageEnter}
        initial="hidden"
        animate="show"
        transition={shouldReduce ? { duration: 0 } : undefined}
      >
        <div className="surface rounded-[1.75rem] p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={matchday.status} />
                <span className="text-sm text-muted-foreground">
                  Saison {matchday.season.year}/{parseInt(matchday.season.year) + 1}
                </span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Spieltag im Blick
                  </p>
                  <h1 className="mt-3 text-5xl leading-none text-foreground">
                    Spieltag <span className="text-primary">{matchday.matchdayNumber}</span>
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground" suppressHydrationWarning>
                Deadline: {new Date(matchday.tippDeadline).toLocaleString('de-DE', {
                  weekday: 'short', day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {prevMd ? (
                <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                  <Link href={`/dashboard/${prevMd}`} aria-label={`Zum Spieltag ${prevMd}`}>
                    <IconChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              ) : (
                <span className="h-10 w-10 shrink-0" aria-hidden="true" />
              )}
              {nextMd ? (
                <Button variant="outline" size="icon" className="h-10 w-10" asChild>
                  <Link href={`/dashboard/${nextMd}`} aria-label={`Zum Spieltag ${nextMd}`}>
                    <IconChevronRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                </Button>
              ) : (
                <span className="h-10 w-10 shrink-0" aria-hidden="true" />
              )}
              {!deadlinePassed && matchday.status === 'ACTIVE' && (
                <Button
                  asChild
                  size="sm"
                  className="ml-1 gap-1.5 font-semibold"
                >
                  <Link href="/tippen">
                    <IconPencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Jetzt tippen
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex-1 min-w-0">
          <AnimatedTabsList tabs={tabDefs} value={activeTab} onChange={setActiveTab} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={panelEnter}
              initial="hidden"
              animate="show"
              exit="hidden"
              transition={shouldReduce ? { duration: 0 } : normal}
            >
              {activeTab === 'spiele' && (
                <div className="space-y-3">
                  <div className="inline-flex rounded-2xl border border-border/70 bg-secondary/72 p-1">
                    {playSubtabs.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setPlaySubtab(tab.value)}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
                          playSubtab === tab.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {playSubtab === 'matches' ? (
                    <motion.ul
                      variants={listStagger}
                      initial="hidden"
                      animate="show"
                      transition={shouldReduce ? { staggerChildren: 0 } : undefined}
                      className="space-y-2.5 list-none"
                    >
                      {matchday.matches.map((match) => (
                        <motion.li
                          key={match.id}
                          variants={panelEnter}
                          transition={shouldReduce ? { duration: 0 } : undefined}
                        >
                          <MatchOverviewRow
                            match={match}
                            tips={tipIndex[match.id] ?? {}}
                            currentUserId={currentUserId}
                            deadlinePassed={deadlinePassed}
                          />
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : (
                    <TipsMatrix
                      matches={matchday.matches}
                      users={matrixUsers}
                      tipIndex={tipIndex}
                      deadlinePassed={deadlinePassed}
                      currentUserId={currentUserId}
                      sortKey={tipsSortKey}
                      sortDirection={tipsSortDirection}
                      onSortChange={toggleTipsSort}
                    />
                  )}
                </div>
              )}

              {activeTab === 'tabelle' && (
                <div className="surface overflow-hidden rounded-[1.5rem]">
                  <StandingsTable year={matchday.season.year} />
                </div>
              )}

              {activeTab === 'stats' && (
                <StatsTab
                  matchday={matchday}
                  users={users}
                  tipIndex={tipIndex}
                  matchdayPointsMap={matchdayPointsMap}
                  seasonPointsMap={seasonPointsMap}
                  seasonStats={seasonStats}
                  currentUserId={currentUserId}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <PointsTable
            users={sortedBySeason}
            matchdayPoints={matchdayPointsMap}
            seasonPoints={seasonPointsMap}
            currentUserId={currentUserId}
          />
        </div>

      </div>
    </div>
  )
}

function MatchOverviewRow({
  match,
  tips,
  deadlinePassed,
  currentUserId,
}: {
  match: Match
  tips: Record<string, TipEntry>
  deadlinePassed: boolean
  currentUserId: string
}) {
  const hasResult = match.homeScore !== null
  const isLive = match.status === 'ACTIVE'
  const matchDate = new Date(match.matchDate)
  const homeIcon = getClubByName(match.homeTeam)?.iconUrl
  const awayIcon = getClubByName(match.awayTeam)?.iconUrl
  const myTip = tips[currentUserId]
  const bestPoints =
    deadlinePassed && hasResult
      ? Math.max(0, ...Object.values(tips).map((tip) => tip.points ?? 0))
      : null

  return (
    <div className={cn('surface overflow-hidden rounded-[1.35rem] transition-all', isLive && 'ring-1 ring-emerald-500/25')}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block" suppressHydrationWarning>
          {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}{' '}
          {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span className="flex-1 truncate text-right text-sm font-semibold">{match.homeTeam}</span>
          <div className="flex shrink-0 items-center gap-2">
            {homeIcon
              ? <img src={homeIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
            <div className="relative flex items-center">
              <span className={cn(
                'w-16 rounded-lg px-1.5 py-0.5 text-center text-xl font-bold tabular-nums',
                hasResult ? 'bg-secondary text-foreground' : 'text-muted-foreground',
              )}>
                {hasResult ? `${match.homeScore}:${match.awayScore}` : '–:–'}
              </span>
              {isLive && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-live-pulse" />}
            </div>
            {awayIcon
              ? <img src={awayIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">{match.awayTeam}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:hidden">
            Du
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:inline">
            Dein Tipp
          </span>
          {myTip ? (
            <>
              <span className="rounded-lg bg-background/72 px-2.5 py-1 text-sm font-bold tabular-nums text-foreground">
                {myTip.homeScore}:{myTip.awayScore}
              </span>
              {myTip.isJoker && (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/12">
                  <IconPokerChip className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
                </span>
              )}
              {deadlinePassed && <PointsBadge points={myTip.points} isJoker={myTip.isJoker} />}
            </>
          ) : (
            <span className="rounded-lg border border-dashed border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Noch kein Tipp
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!deadlinePassed && (
            <span className="rounded-full border border-border/60 bg-background/45 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Vergleich gesperrt
            </span>
          )}
          {deadlinePassed && hasResult && bestPoints !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/45 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Bestwert
              <PointsBadge points={bestPoints} isJoker={bestPoints > 4} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Tips Comparison Matrix ── */
function TipsMatrix({
  matches,
  users,
  tipIndex,
  deadlinePassed,
  currentUserId,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  matches: Match[]
  users: User[]
  tipIndex: Record<string, Record<string, TipEntry>>
  deadlinePassed: boolean
  currentUserId: string
  sortKey: TipsSortKey
  sortDirection: SortDirection
  onSortChange: (key: TipsSortKey) => void
}) {
  const rows = useMemo(() => {
    return [...matches].sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1

      switch (sortKey) {
        case 'matchDate':
          return (new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()) * modifier
        case 'fixture':
          return `${a.homeTeam}-${a.awayTeam}`.localeCompare(`${b.homeTeam}-${b.awayTeam}`, 'de') * modifier
        case 'result':
          return `${a.homeScore ?? -1}:${a.awayScore ?? -1}`.localeCompare(`${b.homeScore ?? -1}:${b.awayScore ?? -1}`, 'de') * modifier
        default:
          return 0
      }
    })
  }, [matches, sortDirection, sortKey])

  return (
    <div className="surface overflow-hidden rounded-[1.35rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Vergleichsmatrix
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'matchDate', label: 'Anstoß' },
            { key: 'fixture', label: 'Spiel' },
            { key: 'result', label: 'Ergebnis' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSortChange(option.key as TipsSortKey)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
                sortKey === option.key
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-border/60 bg-background/45 text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
              {sortKey === option.key && (
                <span className="ml-1 tabular-nums">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <Table className="min-w-max">
        <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-transparent">
          <TableRow>
            <TableHead className="sticky left-0 z-30 min-w-[8.75rem] border-r border-border/50 px-2 sm:min-w-[16rem] sm:px-2.5">
              Spiel
            </TableHead>
            {users.map((user, index) => {
              const club = user.favoriteTeam ? getClubByName(user.favoriteTeam) : undefined
              const isMe = user.id === currentUserId
              return (
                <TableHead
                  key={user.id}
                  className={cn(
                    'min-w-[5.1rem] border-r border-border/50 bg-transparent px-2 text-center',
                    index === 0 && 'border-l border-border/50',
                  )}
                >
                  <Link
                    href={`/spieler/${user.nickname}`}
                    className={cn(
                      'mx-auto flex w-fit max-w-full flex-col items-center gap-1 transition-colors hover:text-foreground',
                      isMe ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {club?.iconUrl ? (
                        <img src={club.iconUrl} alt="" className="h-3.5 w-3.5 object-contain" />
                      ) : user.color ? (
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: user.color }} />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-border" />
                      )}
                      {isMe && <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Du</span>}
                    </span>
                    <span className={cn('max-w-full truncate text-[11px] font-semibold normal-case tracking-normal', isMe && 'text-foreground')}>
                      {user.nickname}
                    </span>
                  </Link>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((match) => {
            const tips = tipIndex[match.id] ?? {}
            const hasResult = match.homeScore !== null
            const homeIcon = getClubByName(match.homeTeam)?.iconUrl
            const awayIcon = getClubByName(match.awayTeam)?.iconUrl

            return (
              <TableRow key={match.id} className="group odd:bg-gray-500/[0.035]">
                <TableCell className="sticky left-0 z-20 min-w-[8.75rem] border-r border-border/50 px-2 py-2 sm:min-w-[16rem] sm:px-2.5">
                  <div className="space-y-2">
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {new Date(match.matchDate).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}{' '}
                      {new Date(match.matchDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 sm:hidden">
                      {homeIcon ? <img src={homeIcon} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
                      <span
                        className={cn(
                          'shrink-0 rounded-lg px-1.5 py-0.5 text-sm font-bold tabular-nums',
                          hasResult ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {hasResult ? `${match.homeScore}:${match.awayScore}` : '–:–'}
                      </span>
                      {awayIcon ? <img src={awayIcon} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
                    </div>
                    <div className="hidden items-center justify-between gap-3 sm:flex">
                      <div className="min-w-0 space-y-1 text-sm font-semibold">
                        <div className="flex min-w-0 items-center gap-2">
                          {homeIcon ? <img src={homeIcon} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
                          <span className="truncate">{match.homeTeam}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          {awayIcon ? <img src={awayIcon} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <span className="h-5 w-5 shrink-0" />}
                          <span className="truncate">{match.awayTeam}</span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums',
                          hasResult ? 'bg-secondary text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {hasResult ? `${match.homeScore}:${match.awayScore}` : '–:–'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {users.map((user, index) => {
                  const tip = tips[user.id]
                  const showTip = deadlinePassed || user.id === currentUserId
                  const isMe = user.id === currentUserId

                  return (
                    <TableCell
                      key={user.id}
                      className={cn(
                        'min-w-[5.1rem] border-r border-border/50 px-2 py-2 text-center',
                        index === 0 && 'border-l border-border/50',
                      )}
                    >
                      {showTip && tip ? (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              'inline-flex min-w-[3.15rem] items-center justify-center rounded-md border border-transparent px-1.5 py-0.5 text-sm font-bold tabular-nums',
                              tip.isJoker
                                ? 'bg-amber-300/12 text-amber-500'
                                : 'bg-transparent text-foreground',
                              isMe && !tip.isJoker && 'text-primary',
                            )}
                          >
                            {tip.homeScore}:{tip.awayScore}
                          </span>
                          {hasResult ? (
                            <PointsBadge points={tip.points} isJoker={tip.isJoker} />
                          ) : (
                            <span className="h-7" aria-hidden="true" />
                          )}
                        </div>
                      ) : showTip ? (
                        <span className="inline-flex min-w-[2.2rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          –
                        </span>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                          <IconLock className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Points Table Sidebar ── */
function PointsTable({
  users,
  matchdayPoints,
  seasonPoints,
  currentUserId,
}: {
  users: User[]
  matchdayPoints: Record<string, number>
  seasonPoints: Record<string, number>
  currentUserId: string
}) {
  return (
    <div className="surface overflow-hidden rounded-[1.5rem]">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <IconTrophy className="h-4 w-4 text-yellow-500 shrink-0" strokeWidth={1.5} />
        <h2 className="text-sm font-bold tracking-wide text-foreground">
          Punktestand
        </h2>
      </div>
      <div className="divide-y divide-border/70">
        <AnimatePresence initial={false}>
          {users.map((u, i) => {
            const isMe = u.id === currentUserId
            const club = u.favoriteTeam ? getClubByName(u.favoriteTeam) : undefined
            return (
              <motion.div
                key={u.id}
                layoutId={u.id}
                layout
                variants={panelEnter}
                initial="hidden"
                animate="show"
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60',
                  isMe && 'bg-primary/5',
                )}
              >
                {/* Rank */}
                <span className="w-5 shrink-0 flex items-center justify-center">
                  <RankIcon rank={i} />
                </span>

                {/* User color dot or club icon */}
                {u.color ? (
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: u.color }}
                  />
                ) : club?.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={club.iconUrl} alt="" className="h-4 w-4 shrink-0 object-contain" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}

                {/* Nickname as link */}
                <Link
                  href={`/spieler/${u.nickname}`}
                  className={cn(
                    'flex-1 truncate text-sm hover:underline underline-offset-4 transition-colors',
                    isMe ? 'font-bold text-primary' : 'text-foreground font-medium',
                  )}
                >
                  {u.nickname}
                  {isMe && <span className="ml-1 text-xs font-normal text-muted-foreground">(du)</span>}
                </Link>

                {/* Points */}
                <div className="text-right shrink-0">
                  <span className="block text-base font-bold tabular-nums text-foreground">
                    {seasonPoints[u.id] ?? 0}
                  </span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    +{matchdayPoints[u.id] ?? 0} ST
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
