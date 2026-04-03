'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StandingsTable } from './standings-table'
import { StatsTab } from './stats-tab'
import type { SeasonMatchdayStat } from './stats-tab'
import { cn } from '@/lib/utils'
import { getClubByName } from '@/lib/clubs'
import { fadeUp, staggerContainer, popIn, spring } from '@/lib/motion'
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
        transition={shouldReduce ? { duration: 0 } : { type: 'spring', bounce: 0.35, duration: 0.35 }}
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

const tabDefs: { value: TabValue; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  { value: 'spiele',  label: 'Spiele & Tipps', mobileLabel: 'Spiele',     icon: <IconBallFootball className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'tabelle', label: 'Bundesliga',      mobileLabel: 'Bundesliga', icon: <IconTable       className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'stats',   label: 'Statistiken',     mobileLabel: 'Stats',      icon: <IconChartBar    className="h-3.5 w-3.5" strokeWidth={1.5} /> },
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
              transition={spring}
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
  const shouldReduce = useReducedMotion()

  const sortedMatchdays = [...matchdayList].sort((a, b) => a.matchdayNumber - b.matchdayNumber)
  const currentIndex = sortedMatchdays.findIndex((m) => m.matchdayNumber === matchday.matchdayNumber)
  const prevMd = currentIndex > 0 ? sortedMatchdays[currentIndex - 1].matchdayNumber : null
  const nextMd = currentIndex < sortedMatchdays.length - 1 ? sortedMatchdays[currentIndex + 1].matchdayNumber : null

  const sortedBySeason = [...users].sort(
    (a, b) => (seasonPointsMap[b.id] ?? 0) - (seasonPointsMap[a.id] ?? 0),
  )

  return (
    <div className="space-y-6">

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: shouldReduce ? 0 : 0.4 }}
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
                    Matchday Control Center
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduce ? 0 : 0.15 }}
            >
              {activeTab === 'spiele' && (
                <motion.ul
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  transition={shouldReduce ? { staggerChildren: 0 } : undefined}
                  className="space-y-2.5 list-none"
                >
                  {matchday.matches.map((match) => (
                    <motion.li
                      key={match.id}
                      variants={fadeUp}
                      transition={{ duration: shouldReduce ? 0 : 0.3 }}
                    >
                      <MatchRow
                        match={match}
                        users={users}
                        tips={tipIndex[match.id] ?? {}}
                        deadlinePassed={deadlinePassed}
                        currentUserId={currentUserId}
                      />
                    </motion.li>
                  ))}
                </motion.ul>
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

/* ── Match Row ── */
function MatchRow({
  match,
  users,
  tips,
  deadlinePassed,
  currentUserId,
}: {
  match: Match
  users: User[]
  tips: Record<string, TipEntry>
  deadlinePassed: boolean
  currentUserId: string
}) {
  const hasResult = match.homeScore !== null
  const isLive = match.status === 'ACTIVE'
  const matchDate = new Date(match.matchDate)
  const homeIcon = getClubByName(match.homeTeam)?.iconUrl
  const awayIcon = getClubByName(match.awayTeam)?.iconUrl

  return (
    <div className={cn(
      'surface overflow-hidden rounded-[1.35rem] transition-all',
      isLive && 'ring-1 ring-emerald-500/25',
    )}>
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
        <span className="hidden sm:block shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
          {matchDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}{' '}
          {matchDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
          <span className="flex-1 truncate text-right text-sm font-semibold">{match.homeTeam}</span>
          {/* Icons + score */}
          <div className="flex items-center gap-2 shrink-0">
            {homeIcon
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={homeIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
            <div className="relative flex items-center">
              <span className={cn(
                'w-16 rounded-lg px-1.5 py-0.5 text-center text-xl font-bold tabular-nums',
                hasResult
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground',
              )}>
                {hasResult ? `${match.homeScore}:${match.awayScore}` : '–:–'}
              </span>
              {isLive && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-live-pulse" />
              )}
            </div>
            {awayIcon
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={awayIcon} alt="" className="h-6 w-6 object-contain" />
              : <span className="h-6 w-6" />}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">{match.awayTeam}</span>
        </div>
      </div>

      {/* Tips row */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 px-4 py-3">
        {users.map((u) => {
          const tip = tips[u.id]
          const showTip = deadlinePassed || u.id === currentUserId
          const isMe = u.id === currentUserId

          return (
            <div
              key={u.id}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-2.5 py-1.5',
                isMe
                  ? 'border-primary/20 bg-primary/8'
                  : 'border-border/60 bg-background/55',
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                {u.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: u.color }}
                  />
                )}
                <span className={cn(
                  'truncate text-xs',
                  isMe ? 'font-semibold text-primary' : 'text-muted-foreground',
                )}>
                  {u.nickname}
                </span>
              </div>
              {showTip && tip ? (
                <div className="grid shrink-0 grid-cols-[3.25rem_auto_2rem] items-center gap-1.5">
                  <span className="rounded-lg bg-background/80 px-2 py-0.5 text-center text-sm font-bold tabular-nums text-foreground">
                    {tip.homeScore}:{tip.awayScore}
                  </span>
                  {tip.isJoker && (deadlinePassed || isMe) && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10">
                      <IconPokerChip className="h-3.5 w-3.5 text-amber-500 shrink-0" strokeWidth={1.5} />
                    </span>
                  )}
                  {!(tip.isJoker && (deadlinePassed || isMe)) && <span className="h-7 w-7" aria-hidden="true" />}
                  <PointsBadge points={tip.points} isJoker={tip.isJoker && (deadlinePassed || isMe)} />
                </div>
              ) : showTip ? (
                <span className="text-xs text-muted-foreground">–</span>
              ) : (
                <span className="text-xs text-muted-foreground">●</span>
              )}
            </div>
          )
        })}
      </div>
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
                variants={fadeUp}
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
