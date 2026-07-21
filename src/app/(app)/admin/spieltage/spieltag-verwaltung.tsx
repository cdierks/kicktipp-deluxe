'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  createSeason,
  deleteSeason,
  setActiveSeason,
  createMatchday,
  setMatchdayStatus,
  updateDeadline,
} from '@/actions/matchday.actions'
import { syncMatchday } from '@/actions/sync.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatAppDate, formatAppDateTimeLocal, parseAppDateTimeLocal } from '@/lib/date-format'
import { IconArrowsSort, IconRefresh, IconTrash } from '@/components/app-icons'

type MatchdayStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED' | 'COMPLETED'
type SortKey = 'season' | 'matchdayNumber' | 'status' | 'tippDeadline' | 'matches' | 'syncedAt'
type SortDirection = 'asc' | 'desc'

interface Matchday {
  id: string
  matchdayNumber: number
  status: MatchdayStatus
  tippDeadline: Date
  syncedAt: Date | null
  _count: { matches: number }
}

interface Season {
  id: string
  year: string
  active: boolean
  matchdays: Matchday[]
}

type MatchdayRowData = Matchday & {
  seasonId: string
  seasonYear: string
  seasonActive: boolean
}

const statusColors: Record<MatchdayStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  UPCOMING: 'secondary',
  ACTIVE: 'default',
  CLOSED: 'outline',
  COMPLETED: 'outline',
}

const statusLabels: Record<MatchdayStatus, string> = {
  UPCOMING: 'Ausstehend',
  ACTIVE: 'Aktiv',
  CLOSED: 'Geschlossen',
  COMPLETED: 'Abgeschlossen',
}

const statusOrder: Record<MatchdayStatus, number> = {
  ACTIVE: 0,
  UPCOMING: 1,
  CLOSED: 2,
  COMPLETED: 3,
}

export function SpieltagVerwaltung({ seasons }: { seasons: Season[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newYear, setNewYear] = useState('')
  const activeSeason = seasons.find((s) => s.active)
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason?.id ?? seasons[0]?.id ?? '')
  const [newMatchdayNum, setNewMatchdayNum] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('matchdayNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId)

  const rows = useMemo(() => {
    const flatRows: MatchdayRowData[] = seasons.flatMap((season) =>
      season.matchdays.map((matchday) => ({
        ...matchday,
        seasonId: season.id,
        seasonYear: season.year,
        seasonActive: season.active,
      })),
    )

    const filtered = selectedSeasonId
      ? flatRows.filter((row) => row.seasonId === selectedSeasonId)
      : flatRows

    return filtered.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'season':
          return a.seasonYear.localeCompare(b.seasonYear) * modifier
        case 'matchdayNumber':
          return (a.matchdayNumber - b.matchdayNumber) * modifier
        case 'status':
          return (statusOrder[a.status] - statusOrder[b.status]) * modifier
        case 'tippDeadline':
          return (a.tippDeadline.getTime() - b.tippDeadline.getTime()) * modifier
        case 'matches':
          return (a._count.matches - b._count.matches) * modifier
        case 'syncedAt':
          return ((a.syncedAt?.getTime() ?? 0) - (b.syncedAt?.getTime() ?? 0)) * modifier
        default:
          return 0
      }
    })
  }, [selectedSeasonId, seasons, sortDirection, sortKey])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDirection('desc')
  }

  function runMutation(operation: () => Promise<void>) {
    startTransition(async () => {
      try {
        await operation()
      } catch {
        toast.error('Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.')
      }
    })
  }

  function handleCreateSeason() {
    if (!newYear) return
    runMutation(async () => {
      const result = await createSeason(newYear)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Saison ${newYear}/${parseInt(newYear) + 1} erstellt`)
      setNewYear('')
      router.refresh()
    })
  }

  function handleDeleteSeason(seasonId: string) {
    runMutation(async () => {
      const result = await deleteSeason(seasonId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Saison gelöscht')
      router.refresh()
    })
  }

  function handleSetActive(seasonId: string) {
    runMutation(async () => {
      const result = await setActiveSeason(seasonId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Aktive Saison gesetzt')
      router.refresh()
    })
  }

  function handleCreateMatchday() {
    if (!selectedSeasonId || !newMatchdayNum || !newDeadline) return
    const parsedDeadline = parseAppDateTimeLocal(newDeadline)
    if (!parsedDeadline) {
      toast.error('Bitte gib eine gültige Deadline ein')
      return
    }
    runMutation(async () => {
      const result = await createMatchday({
        seasonId: selectedSeasonId,
        matchdayNumber: parseInt(newMatchdayNum),
        tippDeadline: parsedDeadline.toISOString(),
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Spieltag erstellt')
      setNewMatchdayNum('')
      setNewDeadline('')
      router.refresh()
    })
  }

  function handleStatusChange(matchdayId: string, status: MatchdayStatus) {
    runMutation(async () => {
      const result = await setMatchdayStatus(matchdayId, status)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Status geändert')
      router.refresh()
    })
  }

  function handleDeadlineUpdate(matchdayId: string, deadline: string) {
    const parsedDeadline = parseAppDateTimeLocal(deadline)
    if (!parsedDeadline) {
      toast.error('Bitte gib eine gültige Deadline ein')
      return
    }
    runMutation(async () => {
      const result = await updateDeadline(matchdayId, parsedDeadline.toISOString())
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Deadline aktualisiert')
      router.refresh()
    })
  }

  function handleSync(matchdayId: string) {
    runMutation(async () => {
      const result = await syncMatchday(matchdayId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.upserted} Spiele synchronisiert`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3 2xl:gap-8">
        <section className="surface rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Saison anlegen</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newSeasonYear">
                Startjahr
              </Label>
              <Input
                id="newSeasonYear"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="2026"
                className="max-w-[10rem]"
              />
            </div>
            <Button onClick={handleCreateSeason} disabled={!newYear || isPending} className="w-full sm:w-auto">
              Saison erstellen
            </Button>
          </div>
        </section>

        <section className="surface rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Spieltag anlegen</h2>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="newMatchdaySeason">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger id="newMatchdaySeason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.year}/{parseInt(season.year) + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newMatchdayNum">
                  Spieltag
                </Label>
                <Input
                  id="newMatchdayNum"
                  type="number"
                  min={1}
                  max={34}
                  value={newMatchdayNum}
                  onChange={(e) => setNewMatchdayNum(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDeadline">
                  Deadline
                </Label>
                <Input
                  id="newDeadline"
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleCreateMatchday}
              disabled={!selectedSeasonId || !newMatchdayNum || !newDeadline || isPending}
              className="w-full sm:w-auto"
            >
              Spieltag erstellen
            </Button>
          </div>
        </section>

        <section className="surface rounded-xl p-4">
          <h2 className="text-base font-semibold text-foreground">Saisonverwaltung</h2>
          <div className="mt-4 space-y-3">
            {seasons.map((season) => (
              <div key={season.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {season.year}/{parseInt(season.year) + 1}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {season.active && <Badge>Aktiv</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {season.matchdays.length} Spieltage
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!season.active && (
                    <Button size="sm" variant="outline" onClick={() => handleSetActive(season.id)} disabled={isPending}>
                      Aktivieren
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="destructive"
                        disabled={isPending}
                        aria-label={`Saison ${season.year}/${parseInt(season.year) + 1} löschen`}
                      >
                        <IconTrash className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Saison wirklich löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Die Saison {season.year}/{parseInt(season.year) + 1} und ihre Spieltage werden dauerhaft entfernt. Dieser Schritt kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => handleDeleteSeason(season.id)}>
                          Saison löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-raised rounded-xl p-4">
        <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-readable">Spieltage</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Spieltagsübersicht
            </h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="matchdaySeasonFilter">Saison</Label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger id="matchdaySeasonFilter" className="min-w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.year}/{parseInt(season.year) + 1}{season.active ? ' · aktiv' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Saison" active={sortKey === 'season'} direction={sortDirection} onClick={() => toggleSort('season')} />
                <SortableHead label="Spieltag" active={sortKey === 'matchdayNumber'} direction={sortDirection} onClick={() => toggleSort('matchdayNumber')} className="text-right" />
                <SortableHead label="Status" active={sortKey === 'status'} direction={sortDirection} onClick={() => toggleSort('status')} />
                <SortableHead label="Deadline" active={sortKey === 'tippDeadline'} direction={sortDirection} onClick={() => toggleSort('tippDeadline')} />
                <SortableHead label="Spiele" active={sortKey === 'matches'} direction={sortDirection} onClick={() => toggleSort('matches')} className="text-right" />
                <SortableHead label="Sync" active={sortKey === 'syncedAt'} direction={sortDirection} onClick={() => toggleSort('syncedAt')} />
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    Für die gewählte Saison gibt es noch keine Spieltage.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <MatchdayTableRow
                    key={row.id}
                    row={row}
                    onStatusChange={handleStatusChange}
                    onDeadlineUpdate={handleDeadlineUpdate}
                    onSync={handleSync}
                    isPending={isPending}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {selectedSeason && (
          <p className="mt-3 text-xs text-muted-foreground">
            Standardfilter: aktive Saison {selectedSeason.year}/{parseInt(selectedSeason.year) + 1}.
          </p>
        )}
      </section>
    </div>
  )
}

function SortableHead({
  label,
  active,
  direction,
  onClick,
  className,
}: {
  label: string
  active: boolean
  direction: SortDirection
  onClick: () => void
  className?: string
}) {
  return (
    <TableHead
      className={className}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 text-inherit transition-colors hover:text-foreground',
          className?.includes('text-right') && 'ml-auto',
          active && 'text-foreground',
        )}
      >
        {label}
        <IconArrowsSort className={cn('h-3.5 w-3.5', active && direction === 'desc' && 'rotate-180')} strokeWidth={1.5} />
      </Button>
    </TableHead>
  )
}

function MatchdayTableRow({
  row,
  onStatusChange,
  onDeadlineUpdate,
  onSync,
  isPending,
}: {
  row: MatchdayRowData
  onStatusChange: (id: string, status: MatchdayStatus) => void
  onDeadlineUpdate: (id: string, deadline: string) => void
  onSync: (id: string) => void
  isPending: boolean
}) {
  const [deadlineVal, setDeadlineVal] = useState(formatAppDateTimeLocal(row.tippDeadline))

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-foreground">
          {row.seasonYear}/{parseInt(row.seasonYear) + 1}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums font-semibold">
        {row.matchdayNumber}
      </TableCell>
      <TableCell>
        <Badge variant={statusColors[row.status]}>{statusLabels[row.status]}</Badge>
      </TableCell>
      <TableCell>
        <Input
          type="datetime-local"
          aria-label={`Deadline für Spieltag ${row.matchdayNumber} der Saison ${row.seasonYear}/${parseInt(row.seasonYear) + 1}`}
          value={deadlineVal}
          onChange={(e) => setDeadlineVal(e.target.value)}
          onBlur={() => {
            const normalized = formatAppDateTimeLocal(row.tippDeadline)
            if (!deadlineVal) {
              setDeadlineVal(normalized)
            } else if (deadlineVal !== normalized) {
              onDeadlineUpdate(row.id, deadlineVal)
            }
          }}
          className="h-9 min-w-48"
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row._count.matches}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.syncedAt
          ? formatAppDate(row.syncedAt, { dateStyle: 'short', timeStyle: 'short' })
          : 'Noch kein Sync'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Select
            value={row.status}
            onValueChange={(value) => onStatusChange(row.id, value as MatchdayStatus)}
          >
            <SelectTrigger
              aria-label={`Status für Spieltag ${row.matchdayNumber} der Saison ${row.seasonYear}/${parseInt(row.seasonYear) + 1}`}
              className="h-9 w-36"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['UPCOMING', 'ACTIVE', 'CLOSED', 'COMPLETED'] as MatchdayStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSync(row.id)}
            disabled={isPending}
            className="gap-1.5"
          >
            <IconRefresh className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sync
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
