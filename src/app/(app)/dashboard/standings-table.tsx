'use client'

import { useEffect, useState } from 'react'
import { fetchTable, OpenligaTable } from '@/lib/openligadb'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Qualifier = { color: string; label: string }

function getQualifier(rank: number): Qualifier | null {
  if (rank === 1)  return { color: 'var(--table-meister)', label: 'Dt. Meister' }
  if (rank <= 4)   return { color: 'var(--table-cl)',      label: 'Champions League' }
  if (rank === 5)  return { color: 'var(--table-el)',      label: 'Europa League' }
  if (rank === 6)  return { color: 'var(--table-el)',      label: 'Conference League' }
  if (rank === 16) return { color: 'var(--table-warning)', label: 'Relegation' }
  if (rank >= 17)  return { color: 'var(--table-danger)',  label: 'Direkter Abstieg' }
  return null
}

const LEGEND: Array<{ color: string; label: string }> = [
  { color: 'var(--table-meister)', label: 'Dt. Meister' },
  { color: 'var(--table-cl)',      label: 'Champions League' },
  { color: 'var(--table-el)',      label: 'Europa / Conference League' },
  { color: 'var(--table-warning)', label: 'Relegation' },
  { color: 'var(--table-danger)',  label: 'Abstieg' },
]

export function StandingsTable({ year }: { year: string }) {
  const [table, setTable] = useState<OpenligaTable[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTable(year, { cache: 'no-store' })
      .then(setTable)
      .catch(() => setError('Tabelle konnte nicht geladen werden'))
  }, [year])

  if (error) return <p className="px-4 py-6 text-sm text-muted-foreground font-sans">{error}</p>
  if (!table) return <p className="px-4 py-6 text-sm text-muted-foreground font-sans">Lade Tabelle…</p>

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {/* Spacer matches the 4px qualifier border on data rows */}
            <TableHead
              className="w-8 pl-3 uppercase tracking-wide text-xs"
              style={{ borderLeft: '4px solid transparent' }}
            >
              #
            </TableHead>
            <TableHead className="uppercase tracking-wide text-xs">Verein</TableHead>
            <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">Sp</TableHead>
            <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">S</TableHead>
            <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">U</TableHead>
            <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">N</TableHead>
            <TableHead className="hidden xs:table-cell text-right uppercase tracking-wide text-xs">Tore</TableHead>
            <TableHead className="hidden sm:table-cell text-right uppercase tracking-wide text-xs">Diff</TableHead>
            <TableHead className="text-right uppercase tracking-wide text-xs">Pkt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.map((team, i) => {
            const rank = i + 1
            const q = getQualifier(rank)
            const diff = team.goalDiff

            return (
              <TableRow key={team.teamInfoId}>
                {/* Rank cell – colored left border as qualifier indicator */}
                <TableCell
                  className="pl-3 font-bold text-sm tabular-nums text-muted-foreground"
                  style={{ borderLeft: `4px solid ${q ? q.color : 'transparent'}` }}
                  title={q?.label}
                >
                  {rank}
                </TableCell>

                {/* Club name + icon */}
                <TableCell className="font-sans font-medium text-sm">
                  <div className="flex items-center gap-2">
                    {team.teamIconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={team.teamIconUrl} alt="" className="h-4 w-4 object-contain shrink-0" />
                    )}
                    {team.shortName || team.teamName}
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">
                  {team.won + team.draw + team.lost}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{team.won}</TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{team.draw}</TableCell>
                <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">{team.lost}</TableCell>
                <TableCell className="hidden xs:table-cell text-right tabular-nums text-sm">
                  {team.goals}:{team.opponentGoals}
                </TableCell>

                {/* Goal difference – green / grey / red */}
                <TableCell
                  className={cn('hidden sm:table-cell text-right tabular-nums text-sm', diff > 0 && 'font-semibold')}
                  style={{
                    color: diff > 0
                      ? 'var(--table-el)'
                      : diff < 0
                        ? 'var(--table-danger)'
                        : 'var(--muted-foreground)',
                  }}
                >
                  {diff > 0 ? '+' : ''}{diff}
                </TableCell>

                <TableCell className="text-right text-base font-bold tabular-nums text-foreground">
                  {team.points}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-4 py-3">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground font-sans">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
