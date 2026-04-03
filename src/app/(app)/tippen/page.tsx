import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getActiveMatchday } from '@/lib/matchday'
import { prisma } from '@/lib/prisma'
import { TipForm } from './tip-form'
import { ReducedStandingsTable } from './reduced-standings-table'

export default async function TippenPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const matchday = await getActiveMatchday()

  if (!matchday) {
    return (
      <div className="py-12 text-center">
        <p className="text-xl font-semibold uppercase tracking-wide text-muted-foreground">
          Kein aktiver Spieltag
        </p>
        <p className="mt-2 text-sm text-muted-foreground font-sans">
          Der Admin hat noch keinen Spieltag aktiviert.
        </p>
      </div>
    )
  }

  const existingTips = await prisma.tip.findMany({
    where: { userId: session.user.id, match: { matchdayId: matchday.id } },
    select: { matchId: true, homeScore: true, awayScore: true, isJoker: true },
  })

  const tipMap = Object.fromEntries(existingTips.map((t) => [t.matchId, t]))
  const deadlinePassed = new Date() > matchday.tippDeadline

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="surface rounded-[1.75rem] p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Tippen
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">
              Spieltag {matchday.matchdayNumber}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Triff deine Tipps, sichere den Joker und nutze die Tabelle rechts als schnellen Form- und Punkte-Kontext.
            </p>
          </div>
          <div
            className={
              deadlinePassed
                ? 'rounded-[1.4rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive'
                : 'rounded-[1.4rem] border border-primary/15 bg-primary/[0.07] px-4 py-3 text-foreground'
            }
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {deadlinePassed ? 'Deadline abgelaufen' : 'Tipp-Deadline'}
            </p>
            <p className={deadlinePassed ? 'mt-2 text-lg font-bold' : 'mt-2 text-lg font-bold text-foreground'} suppressHydrationWarning>
              {new Date(matchday.tippDeadline).toLocaleString('de-DE', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {deadlinePassed
                ? 'Dieser Spieltag ist bereits gesperrt.'
                : 'Danach werden alle Eingaben geschlossen.'}
            </p>
          </div>
        </div>
      </div>

      {deadlinePassed ? (
        <div className="surface rounded-[1.5rem] px-5 py-6">
          <p className="text-base font-bold tracking-tight text-muted-foreground">
            Für diesen Spieltag können keine Tipps mehr abgegeben werden.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <TipForm matches={matchday.matches} existingTips={tipMap} />
          <aside className="surface h-fit rounded-[1.5rem] p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Bundesliga
              </p>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-foreground">
                Tabellenstand
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Platz, Punkte und Differenz als schnelle Orientierung für deine Tipps.
              </p>
            </div>
            <div className="mb-3 grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_3.25rem] gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>#</span>
              <span>Verein</span>
              <span className="text-right">Diff</span>
              <span className="text-right">Pkt</span>
            </div>
            <ReducedStandingsTable year={matchday.season.year} />
          </aside>
        </div>
      )}
    </div>
  )
}
