import { ClubIcon } from '@/components/club-icon'
import { getClubByName } from '@/lib/clubs'
import { fetchTable, OpenligaTable } from '@/lib/openligadb'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDiff(diff: number) {
  return `${diff > 0 ? '+' : ''}${diff}`
}

export async function ReducedStandingsTable({ year }: { year: string }) {
  let table: OpenligaTable[]
  try {
    table = await fetchTable(year, { next: { revalidate: 300 } })
  } catch {
    return <p className="px-1 py-4 text-sm text-muted-foreground">Tabelle konnte nicht geladen werden.</p>
  }

  if (table.length === 0) {
    return <p className="px-1 py-4 text-sm text-muted-foreground">Noch keine Tabellendaten verfügbar.</p>
  }

  return (
    <Table className="table-fixed border-collapse" containerClassName="overflow-x-auto">
        <TableCaption className="sr-only">Aktueller Bundesliga-Tabellenstand</TableCaption>
        <colgroup>
          <col className="w-12" />
          <col />
          <col className="w-14" />
          <col className="w-14" />
        </colgroup>
        <TableHeader className="border-y border-border">
          <TableRow>
            <TableHead scope="col" className="w-12 px-4 py-2.5 text-left">#</TableHead>
            <TableHead scope="col" className="px-2 py-2.5 text-left">Verein</TableHead>
            <TableHead scope="col" className="w-14 px-2 py-2.5 text-right">Diff</TableHead>
            <TableHead scope="col" className="w-14 px-4 py-2.5 text-right">Pkt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.map((team, index) => {
            const rank = index + 1
            const diff = team.goalDiff
            const club = getClubByName(team.teamName)
            return (
              <TableRow key={team.teamInfoId}>
                <TableCell className="px-4 py-2.5 font-semibold text-muted-foreground">{rank}</TableCell>
                <TableHead scope="row" className="h-auto px-2 py-2.5 text-left font-medium whitespace-normal text-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    {team.teamIconUrl && (
                      <ClubIcon
                        src={club?.iconUrl ?? team.teamIconUrl}
                        fallbackSrc={club?.iconSourceUrl ?? team.teamIconUrl}
                        label={club?.name ?? (team.shortName || team.teamName)}
                        className="h-4 w-4 shrink-0 object-contain"
                      />
                    )}
                    <span className="truncate">{team.shortName || team.teamName}</span>
                  </span>
                </TableHead>
                <TableCell
                  className={cn(
                    'px-2 py-2.5 text-right font-medium tabular-nums',
                    diff > 0
                      ? 'text-success-800 dark:text-success-300'
                      : diff < 0
                        ? 'text-error-700 dark:text-error-300'
                        : 'text-muted-foreground',
                  )}
                >
                  {formatDiff(diff)}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-bold text-foreground">
                  {team.points}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
    </Table>
  )
}
