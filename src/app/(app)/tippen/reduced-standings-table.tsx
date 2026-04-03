'use client'

import { useEffect, useState } from 'react'
import { ClubIcon } from '@/components/club-icon'
import { getClubByName } from '@/lib/clubs'
import { fetchTable, OpenligaTable } from '@/lib/openligadb'
import { cn } from '@/lib/utils'

function formatDiff(diff: number) {
  return `${diff > 0 ? '+' : ''}${diff}`
}

export function ReducedStandingsTable({ year }: { year: string }) {
  const [table, setTable] = useState<OpenligaTable[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTable(year, { cache: 'no-store' })
      .then(setTable)
      .catch(() => setError('Tabelle konnte nicht geladen werden'))
  }, [year])

  if (error) {
    return <p className="px-1 py-4 text-sm text-muted-foreground font-sans">{error}</p>
  }

  if (!table) {
    return <p className="px-1 py-4 text-sm text-muted-foreground font-sans">Lade Tabelle…</p>
  }

  return (
    <div className="space-y-2">
      {table.map((team, index) => {
        const rank = index + 1
        const diff = team.goalDiff
        const club = getClubByName(team.teamName)
        return (
          <div
            key={team.teamInfoId}
            className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_3.25rem] items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5"
          >
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">{rank}</span>
            <div className="flex min-w-0 items-center gap-2">
              {team.teamIconUrl && (
                <ClubIcon
                  src={club?.iconUrl ?? team.teamIconUrl}
                  fallbackSrc={club?.iconSourceUrl ?? team.teamIconUrl}
                  label={club?.name ?? (team.shortName || team.teamName)}
                  className="h-4 w-4 shrink-0 object-contain"
                />
              )}
              <span className="truncate text-sm font-medium text-foreground">
                {team.shortName || team.teamName}
              </span>
            </div>
            <span
              className={cn(
                'text-right text-sm font-medium tabular-nums',
                diff > 0
                  ? 'text-emerald-500'
                  : diff < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground',
              )}
            >
              {formatDiff(diff)}
            </span>
            <span className="text-right text-sm font-bold tabular-nums text-foreground">
              {team.points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
