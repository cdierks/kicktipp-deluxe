import { cn } from '@/lib/utils'

const statusTones: Record<string, string> = {
  Aktiv: 'border-success-400 bg-success-100 text-success-900 dark:border-success-700 dark:bg-success-900 dark:text-success-100',
  Ausstehend: 'border-secondary-400 bg-secondary-100 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100',
  Geschlossen: 'border-warning-400 bg-warning-100 text-warning-900 dark:border-warning-700 dark:bg-warning-900 dark:text-warning-100',
  Abgeschlossen: 'border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
}

export function MatchdayContext({
  statusLabel,
  seasonLabel,
  matchdayNumber,
}: {
  statusLabel: string
  seasonLabel: string
  matchdayNumber: number
}) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          'rounded-full border px-2.5 py-1 text-xs font-semibold',
          statusTones[statusLabel]
            ?? 'border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
        )}
      >
        {statusLabel}
      </span>
      <span className="text-sm text-muted-foreground">{seasonLabel}</span>
      <span className="text-sm text-muted-foreground">Spieltag {matchdayNumber}</span>
    </span>
  )
}
