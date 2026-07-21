import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getActiveMatchday } from '@/lib/matchday'
import { prisma } from '@/lib/prisma'
import { TipForm } from './tip-form'
import { ReducedStandingsTable } from './reduced-standings-table'
import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageFrame } from '@/components/page-frame'
import { MatchdayContext } from '@/components/matchday-context'
import { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/matchday'
import { createTipRevision } from '@/lib/tip-revision'
import { formatAppDate } from '@/lib/date-format'

export default async function TippenPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const matchday = await getActiveMatchday()

  if (!matchday) {
    return (
      <PageFrame>
        <PageHeader
          eyebrow="Spieltag"
          title="Tippen"
          description="Sobald ein Spieltag aktiviert wurde, kannst du hier deine Tipps abgeben."
        />
        <section className="surface-raised rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Der Admin hat noch keinen Spieltag aktiviert.</p>
        </section>
      </PageFrame>
    )
  }

  const existingTips = await prisma.tip.findMany({
    where: { userId: session.user.id, match: { matchdayId: matchday.id } },
    select: { matchId: true, homeScore: true, awayScore: true, isJoker: true },
  })

  const tipMap = Object.fromEntries(existingTips.map((t) => [t.matchId, t]))
  const tipRevision = createTipRevision(existingTips)
  const effectiveDeadline = getEffectiveTipDeadline(
    matchday.tippDeadline,
    matchday.matches.map((match) => match.matchDate),
  )
  const deadlinePassed = isDeadlinePassed(effectiveDeadline)

  return (
    <PageFrame>
      <PageHeader
        eyebrow={
          <MatchdayContext
            statusLabel="Aktiv"
            seasonLabel={`Saison ${matchday.season.year}/${parseInt(matchday.season.year, 10) + 1}`}
            matchdayNumber={matchday.matchdayNumber}
          />
        }
        title="Tippen"
        description="Triff deine Tipps, sichere den Joker und nutze die Tabelle rechts als schnellen Form- und Punkte-Kontext."
        aside={
          <div
            className={
              deadlinePassed
                ? 'rounded-lg border border-error-300 bg-error-100 px-4 py-3 text-error-900 dark:border-error-700 dark:bg-error-900 dark:text-error-100'
                : 'rounded-lg border border-primary-300 bg-primary-100 px-4 py-3 text-primary-900 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-100'
            }
          >
            <p className="text-xs font-medium text-muted-foreground">
              {deadlinePassed ? 'Deadline abgelaufen' : 'Tipp-Deadline'}
            </p>
            <p className={deadlinePassed ? 'mt-2 text-lg font-bold' : 'mt-2 text-lg font-bold text-foreground'} suppressHydrationWarning>
              {formatAppDate(effectiveDeadline, {
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
        }
      />

      {matchday.matches.length === 0 ? (
        <Alert>
          <AlertTitle>Noch keine Spiele vorhanden</AlertTitle>
          <AlertDescription>
            Für diesen Spieltag wurden noch keine Begegnungen synchronisiert.
          </AlertDescription>
        </Alert>
      ) : deadlinePassed ? (
        <Alert variant="destructive">
          <AlertTitle>Tipps geschlossen</AlertTitle>
          <AlertDescription>
            Für diesen Spieltag können keine Tipps mehr abgegeben werden.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 2xl:gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <TipForm
            key={`${matchday.id}:${tipRevision}:${matchday.matches.map((match) => match.id).join(',')}`}
            matches={matchday.matches}
            existingTips={tipMap}
          />
          <Card className="surface-raised h-fit gap-0 py-0">
            <CardHeader className="p-4 pb-3">
              <p className="text-xs font-medium text-muted-foreground">
                Bundesliga
              </p>
              <CardTitle className="text-lg">Tabellenstand</CardTitle>
              <CardDescription>
                Platz, Punkte und Differenz als schnelle Orientierung für deine Tipps.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ReducedStandingsTable year={matchday.season.year} />
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  )
}
