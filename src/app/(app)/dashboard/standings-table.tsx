import { ClubIcon } from '@/components/club-icon'
import { getClubByName } from '@/lib/clubs'
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

export async function StandingsTable({ year }: { year: string }) {
  let table: OpenligaTable[]
  try {
    table = await fetchTable(year, { next: { revalidate: 300 } })
  } catch {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Tabelle konnte nicht geladen werden.</p>
  }

  if (table.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">Noch keine Tabellendaten verfügbar.</p>
  }

  return (
    <div>
      <Table containerClassName="rounded-none">
        <TableHeader>
          <TableRow>
            <TableHead
              className="w-16 pl-4"
            >
              #
            </TableHead>
            <TableHead>Verein</TableHead>
            <TableHead className="hidden sm:table-cell text-right"><abbr title="Spiele">Sp</abbr></TableHead>
            <TableHead className="hidden sm:table-cell text-right"><abbr title="Siege">S</abbr></TableHead>
            <TableHead className="hidden sm:table-cell text-right"><abbr title="Unentschieden">U</abbr></TableHead>
            <TableHead className="hidden sm:table-cell text-right"><abbr title="Niederlagen">N</abbr></TableHead>
            <TableHead className="hidden xs:table-cell text-right">Tore</TableHead>
            <TableHead className="hidden sm:table-cell text-right"><abbr title="Tordifferenz">Diff</abbr></TableHead>
            <TableHead className="text-right"><abbr title="Punkte">Pkt</abbr></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.map((team, i) => {
            const rank = i + 1
            const q = getQualifier(rank)
            const diff = team.goalDiff
            const club = getClubByName(team.teamName)

            return (
              <TableRow key={team.teamInfoId}>
                <TableCell
                  className="w-16 pl-4 text-sm font-bold tabular-nums text-muted-foreground"
                  title={q?.label}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', !q && 'opacity-0')}
                      style={q ? { backgroundColor: q.color } : undefined}
                    />
                    <span>{rank}</span>
                    {q && <span className="sr-only">, {q.label}</span>}
                  </div>
                </TableCell>

                <TableCell className="font-sans font-medium text-sm">
                  <div className="flex items-center gap-2">
                    {team.teamIconUrl && (
                      <ClubIcon
                        src={club?.iconUrl ?? team.teamIconUrl}
                        fallbackSrc={club?.iconSourceUrl ?? team.teamIconUrl}
                        label={club?.name ?? (team.shortName || team.teamName)}
                        className="h-4 w-4 object-contain shrink-0"
                      />
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

                <TableCell
                  className={cn(
                    'hidden text-right text-sm tabular-nums sm:table-cell',
                    diff > 0 && 'font-semibold text-success-800 dark:text-success-300',
                    diff < 0 && 'text-error-700 dark:text-error-300',
                    diff === 0 && 'text-muted-foreground',
                  )}
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

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-4 py-3">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
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
