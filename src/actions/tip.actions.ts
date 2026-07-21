'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/matchday'
import { createTipRevision } from '@/lib/tip-revision'

const TipSchema = z.object({
  matchId: z.string().min(1).max(191),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  isJoker: z.boolean().default(false),
})

const uniqueIds = (values: string[]) => new Set(values).size === values.length

const SubmitAllTipsSchema = z.object({
  baseRevision: z.string().max(20_000),
  matchIds: z.array(z.string().min(1).max(191))
    .min(1, 'Mindestens ein Spiel ist erforderlich')
    .max(34, 'Zu viele Spiele')
    .refine(uniqueIds, { message: 'Ein Spiel darf nur einmal enthalten sein' }),
  tips: z.array(TipSchema)
    .max(34, 'Zu viele Tipps')
    .refine(
      (tips) => tips.filter((tip) => tip.isJoker).length <= 1,
      { message: 'Nur ein Joker pro Spieltag erlaubt' },
    )
    .refine(
      (tips) => uniqueIds(tips.map((tip) => tip.matchId)),
      { message: 'Ein Tipp darf nur einmal enthalten sein' },
    ),
})

class TipSubmissionError extends Error {}
class TipConflictError extends Error {}

export async function submitAllTips(snapshot: z.infer<typeof SubmitAllTipsSchema>) {
  const session = await getSession()
  if (!session?.user.id) return { error: 'Nicht eingeloggt' }

  const parsed = SubmitAllTipsSchema.safeParse(snapshot)
  if (!parsed.success) return { error: 'Ungültige Eingabe' }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const matchday = await tx.matchday.findFirst({
        where: { status: 'ACTIVE' },
        include: { matches: { select: { id: true, matchDate: true } } },
      })
      if (!matchday) throw new TipSubmissionError('Kein aktiver Spieltag')
      const effectiveDeadline = getEffectiveTipDeadline(
        matchday.tippDeadline,
        matchday.matches.map((match) => match.matchDate),
      )
      if (isDeadlinePassed(effectiveDeadline)) {
        throw new TipSubmissionError('Tipp-Deadline ist abgelaufen')
      }

      const activeMatchIds = matchday.matches.map((match) => match.id).sort()
      const submittedMatchIds = [...parsed.data.matchIds].sort()
      if (
        activeMatchIds.length !== submittedMatchIds.length
        || activeMatchIds.some((matchId, index) => matchId !== submittedMatchIds[index])
      ) {
        throw new TipSubmissionError('Die Spielauswahl ist nicht mehr aktuell')
      }
      if (parsed.data.tips.some((tip) => !activeMatchIds.includes(tip.matchId))) {
        throw new TipSubmissionError('Mindestens ein Tipp gehört nicht zum aktiven Spieltag')
      }

      const persistedTips = await tx.tip.findMany({
        where: { userId: session.user.id, match: { matchdayId: matchday.id } },
        select: { matchId: true, homeScore: true, awayScore: true, isJoker: true },
      })
      if (createTipRevision(persistedTips) !== parsed.data.baseRevision) {
        throw new TipConflictError('Deine Tipps wurden in einem anderen Tab geändert. Die aktuelle Fassung wird neu geladen.')
      }

      // Joker reset and all score writes commit together. A failed upsert must
      // never leave the previous joker allocation or only part of the form.
      await tx.tip.updateMany({
        where: {
          userId: session.user.id,
          match: { matchdayId: matchday.id },
        },
        data: { isJoker: false },
      })

      const tippedMatchIds = parsed.data.tips.map((tip) => tip.matchId)
      await tx.tip.deleteMany({
        where: {
          userId: session.user.id,
          match: { matchdayId: matchday.id },
          ...(tippedMatchIds.length > 0 ? { matchId: { notIn: tippedMatchIds } } : {}),
        },
      })

      for (const tip of parsed.data.tips) {
        await tx.tip.upsert({
          where: { userId_matchId: { userId: session.user.id, matchId: tip.matchId } },
          create: {
            userId: session.user.id,
            matchId: tip.matchId,
            homeScore: tip.homeScore,
            awayScore: tip.awayScore,
            isJoker: tip.isJoker,
          },
          update: {
            homeScore: tip.homeScore,
            awayScore: tip.awayScore,
            points: null,
            isJoker: tip.isJoker,
          },
        })
      }

      return {
        saved: parsed.data.tips.length,
        revision: createTipRevision(parsed.data.tips),
      }
    }, { isolationLevel: 'Serializable' })

    return { success: true, ...saved }
  } catch (error) {
    if (error instanceof TipConflictError) return { error: error.message, conflict: true as const }
    if (error instanceof TipSubmissionError) return { error: error.message }
    // Infrastructure failures can be retried with the same idempotent snapshot;
    // validation, auth and deadline errors above are terminal for this view.
    return { error: 'Tipps konnten nicht gespeichert werden', retryable: true as const }
  }
}
