'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { StandingsTable } from './standings-table'
import { StatsTab } from './stats-tab'
import type { SeasonMatchdayStat } from './stats-tab'
import { cn } from '@/lib/utils'
import { normal, panelEnter, pageEnter } from '@/lib/motion'
import { MatchdayHeader, MatchdayPanel } from './matchday-panel'
import type { MatchdayPageViewModel } from './matchday-view-model'
import {
  IconBallFootball,
  IconTable,
  IconChartBar,
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
  matchdayPageModel: MatchdayPageViewModel
}

type TabValue = 'spieltag' | 'tabelle' | 'stats'

const tabDefs: { value: TabValue; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  { value: 'spieltag', label: 'Spieltag', mobileLabel: 'Spieltag', icon: <IconBallFootball className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'tabelle', label: 'Bundesliga', mobileLabel: 'Liga', icon: <IconTable className="h-3.5 w-3.5" strokeWidth={1.5} /> },
  { value: 'stats', label: 'Statistiken', mobileLabel: 'Stats', icon: <IconChartBar className="h-3.5 w-3.5" strokeWidth={1.5} /> },
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
  matchdayPageModel,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabValue>('spieltag')
  const shouldReduce = useReducedMotion()

  return (
    <div className="space-y-6">
      <motion.div
        variants={pageEnter}
        initial="hidden"
        animate="show"
        transition={shouldReduce ? { duration: 0 } : undefined}
      >
        <MatchdayHeader model={matchdayPageModel} />
      </motion.div>

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
          {activeTab === 'spieltag' && <MatchdayPanel model={matchdayPageModel} />}

          {activeTab === 'tabelle' && (
            <div className="surface overflow-hidden rounded-[1.4rem]">
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
  )
}
