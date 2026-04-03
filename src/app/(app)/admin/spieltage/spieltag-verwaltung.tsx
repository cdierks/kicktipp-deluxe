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
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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
    setSortDirection(key === 'matchdayNumber' ? 'asc' : 'desc')
  }

  async function handleCreateSeason() {
    if (!newYear) return
    const result = await createSeason(newYear)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Saison ${newYear}/${parseInt(newYear) + 1} erstellt`)
    setNewYear('')
    startTransition(() => router.refresh())
  }

  async function handleDeleteSeason(seasonId: string) {
    const result = await deleteSeason(seasonId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Saison gelöscht')
    startTransition(() => router.refresh())
  }

  async function handleSetActive(seasonId: string) {
    const result = await setActiveSeason(seasonId)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Aktive Saison gesetzt')
    startTransition(() => router.refresh())
  }

  async function handleCreateMatchday() {
    if (!selectedSeasonId || !newMatchdayNum || !newDeadline) return
    const result = await createMatchday({
      seasonId: selectedSeasonId,
      matchdayNumber: parseInt(newMatchdayNum),
      tippDeadline: new Date(newDeadline).toISOString(),
    })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Spieltag erstellt')
    setNewMatchdayNum('')
    setNewDeadline('')
    startTransition(() => router.refresh())
  }

  async function handleStatusChange(matchdayId: string, status: MatchdayStatus) {
    const result = await setMatchdayStatus(matchdayId, status)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Status geändert')
    startTransition(() => router.refresh())
  }

  async function handleDeadlineUpdate(matchdayId: string, deadline: string) {
    const result = await updateDeadline(matchdayId, new Date(deadline).toISOString())
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Deadline aktualisiert')
    startTransition(() => router.refresh())
  }

  async function handleSync(matchdayId: string, year: string, matchdayNumber: number) {
    const result = await syncMatchday(matchdayId, year, matchdayNumber)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`${result.upserted} Spiele synchronisiert`)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface rounded-[1.5rem] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Saison anlegen
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newSeasonYear" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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

        <section className="surface rounded-[1.5rem] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Spieltag anlegen
          </p>
          <div className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Saison</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger>
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
                <Label htmlFor="newMatchdayNum" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
                <Label htmlFor="newDeadline" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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

        <section className="surface rounded-[1.5rem] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Saisonverwaltung
          </p>
          <div className="mt-4 space-y-3">
            {seasons.map((season) => (
              <div key={season.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
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
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSeason(season.id)} disabled={isPending}>
                    <IconTrash className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface rounded-[1.5rem] p-5">
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Spieltage
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Sortierbare Verwaltungstabelle
            </h2>
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Saison</Label>
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger className="min-w-52">
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

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
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
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 text-inherit transition-colors hover:text-foreground',
          className?.includes('text-right') && 'ml-auto',
          active && 'text-foreground',
        )}
      >
        {label}
        <IconArrowsSort className={cn('h-3.5 w-3.5', active && direction === 'desc' && 'rotate-180')} strokeWidth={1.5} />
      </button>
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
  onSync: (id: string, year: string, num: number) => void
  isPending: boolean
}) {
  const [deadlineVal, setDeadlineVal] = useState(new Date(row.tippDeadline).toISOString().slice(0, 16))

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
          value={deadlineVal}
          onChange={(e) => setDeadlineVal(e.target.value)}
          onBlur={() => {
            const normalized = new Date(row.tippDeadline).toISOString().slice(0, 16)
            if (deadlineVal !== normalized) onDeadlineUpdate(row.id, deadlineVal)
          }}
          className="h-9 min-w-48"
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row._count.matches}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.syncedAt ? new Date(row.syncedAt).toLocaleString('de-DE') : 'Noch kein Sync'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Select
            value={row.status}
            onValueChange={(value) => onStatusChange(row.id, value as MatchdayStatus)}
          >
            <SelectTrigger className="h-9 w-36">
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
            onClick={() => onSync(row.id, row.seasonYear, row.matchdayNumber)}
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
