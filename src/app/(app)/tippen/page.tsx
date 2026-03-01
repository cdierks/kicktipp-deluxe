import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getActiveMatchday } from '@/lib/matchday'
import { prisma } from '@/lib/prisma'
import { TipForm } from './tip-form'

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
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Spieltag {matchday.matchdayNumber}
        </h1>
        {/* Deadline banner */}
        <div className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
          deadlinePassed
            ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/5 text-foreground border border-primary/10'
        }`}>
          <span className="font-semibold uppercase tracking-wide text-[11px]">
            {deadlinePassed ? 'Deadline abgelaufen' : 'Deadline:'}
          </span>
          {!deadlinePassed && (
            <span className="font-medium" suppressHydrationWarning>
              {new Date(matchday.tippDeadline).toLocaleString('de-DE', {
                weekday: 'long', day: 'numeric', month: 'long',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {deadlinePassed ? (
        <div className="glass rounded-2xl px-5 py-6">
          <p className="text-base font-bold tracking-tight text-muted-foreground">
            Für diesen Spieltag können keine Tipps mehr abgegeben werden.
          </p>
        </div>
      ) : (
        <TipForm matches={matchday.matches} existingTips={tipMap} />
      )}
    </div>
  )
}
