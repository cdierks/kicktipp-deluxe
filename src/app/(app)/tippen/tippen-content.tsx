'use client'

import { useState } from 'react'
import type { OpenligaTable } from '@/lib/openligadb'
import { TipForm } from './tip-form'
import { ReducedStandingsTable } from './reduced-standings-table'

interface Match { id: string; homeTeam: string; awayTeam: string; matchDate: Date }
interface TipEntry { homeScore: number; awayScore: number; isJoker: boolean }
export function TippenContent({ matches, existingTips, table, formKey }: { matches: Match[]; existingTips: Record<string, TipEntry>; table: OpenligaTable[]; formKey: string }) {
  const [focusedTeams, setFocusedTeams] = useState<[string, string] | null>(null)
  return <div className="grid gap-6 min-[1180px]:grid-cols-[minmax(0,1fr)_20rem]">
    <TipForm key={formKey} matches={matches} existingTips={existingTips} onFocusedMatchChange={setFocusedTeams} />
    <aside className="surface-raised h-fit overflow-hidden rounded-2xl"><h2 className="border-b border-border p-4 text-xl">Bundesliga-Tabelle</h2><ReducedStandingsTable table={table} focusedTeams={focusedTeams} /></aside>
  </div>
}
