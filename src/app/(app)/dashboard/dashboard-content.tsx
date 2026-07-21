'use client'

import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { SeasonMatchdayStat } from './stats-tab'
import { normal, panelEnter, pageEnter } from '@/lib/motion'
import { MatchdayHeader, MatchdayPanel } from './matchday-panel'
import type { MatchdayPageViewModel } from './matchday-view-model'
import { parseDashboardView } from '@/lib/dashboard-view'
import { PageFrame } from '@/components/page-frame'

const StatsTab = dynamic(
  () => import('./stats-tab').then((module) => module.StatsTab),
  {
    loading: () => (
      <div className="surface-muted rounded-xl px-6 py-10 text-center text-sm text-muted-foreground" role="status">
        Statistiken werden geladen…
      </div>
    ),
  },
)

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
  standings: React.ReactNode
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
  standings,
}: Props) {
  const searchParams = useSearchParams()
  const activeView = parseDashboardView(searchParams.get('ansicht'))
  const shouldReduce = useReducedMotion()

  return (
    <PageFrame>
      <motion.div
        variants={pageEnter}
        initial="hidden"
        animate="show"
        transition={shouldReduce ? { duration: 0 } : undefined}
      >
        <MatchdayHeader model={matchdayPageModel} view={activeView} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          variants={panelEnter}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={shouldReduce ? { duration: 0 } : normal}
        >
          {activeView === 'spieltag' && <MatchdayPanel model={matchdayPageModel} />}

          {activeView === 'bundesliga' && (
            <div className="surface-raised overflow-hidden rounded-xl">
              {standings}
            </div>
          )}

          {activeView === 'statistiken' && (
            <StatsTab
              matchday={matchday}
              matchdayUnlocked={matchdayPageModel.header.deadlinePassed}
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
    </PageFrame>
  )
}
