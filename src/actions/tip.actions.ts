'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isDeadlinePassed } from '@/lib/matchday'

const TipSchema = z.object({
  matchId: z.string(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  isJoker: z.boolean().default(false),
})

const SubmitAllTipsSchema = z
  .array(TipSchema)
  .refine(
    (tips) => tips.filter((t) => t.isJoker).length <= 1,
    { message: 'Nur ein Joker pro Spieltag erlaubt' },
  )

export async function submitAllTips(tips: z.infer<typeof SubmitAllTipsSchema>) {
  const session = await getSession()
  if (!session) return { error: 'Nicht eingeloggt' }

  const parsed = SubmitAllTipsSchema.safeParse(tips)
  if (!parsed.success) return { error: 'Ungültige Eingabe' }

  // Fetch active matchday to check deadline
  const matchday = await prisma.matchday.findFirst({
    where: { status: 'ACTIVE' },
  })

  if (!matchday) return { error: 'Kein aktiver Spieltag' }
  if (isDeadlinePassed(matchday.tippDeadline)) {
    return { error: 'Tipp-Deadline ist abgelaufen' }
  }

  // Validate all match IDs belong to this matchday
  const matchIds = parsed.data.map((t) => t.matchId)
  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds }, matchdayId: matchday.id },
    select: { id: true },
  })
  const validMatchIds = new Set(matches.map((m) => m.id))

  const validTips = parsed.data.filter((t) => validMatchIds.has(t.matchId))
  if (validTips.length === 0) return { error: 'Keine gültigen Spiele' }

  // Reset all jokers for this user+matchday, then upsert with new values
  await prisma.tip.updateMany({
    where: {
      userId: session.user.id,
      match: { matchdayId: matchday.id },
    },
    data: { isJoker: false },
  })

  await Promise.all(
    validTips.map((tip) =>
      prisma.tip.upsert({
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
          isJoker: tip.isJoker,
        },
      }),
    ),
  )

  return { success: true, saved: validTips.length }
}
