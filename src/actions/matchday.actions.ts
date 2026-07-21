'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guards'
import { recalculatePointsForMatchInTransaction } from '@/lib/point-recalculation'
import { MatchdayStatus } from '@/generated/prisma/enums'
import { getEffectiveTipDeadline, isDeadlinePassed } from '@/lib/matchday'

type ActionResult = { error?: string; success?: boolean }

const idSchema = z.string().min(1).max(191)
const seasonYearSchema = z.string().regex(/^\d{4}$/, 'Saisonjahr muss vierstellig sein')
const matchdayStatusSchema = z.nativeEnum(MatchdayStatus)
const deadlineSchema = z.string().datetime('Ungültige Deadline')
const scoreSchema = z.number().int().min(0).max(99)

export async function createSeason(year: string): Promise<ActionResult & { season?: { id: string; year: string } }> {
  try {
    await requireAdmin()
    const parsedYear = seasonYearSchema.safeParse(year)
    if (!parsedYear.success) return { error: parsedYear.error.issues[0].message }

    const existing = await prisma.season.findUnique({ where: { year: parsedYear.data } })
    if (existing) return { error: 'Saison existiert bereits' }
    const season = await prisma.season.create({ data: { year: parsedYear.data } })
    return { success: true, season }
  } catch {
    return { error: 'Saison konnte nicht erstellt werden' }
  }
}

export async function deleteSeason(seasonId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsedId = idSchema.safeParse(seasonId)
    if (!parsedId.success) return { error: 'Ungültige Saison' }

    await prisma.$transaction(async (tx) => {
      const tipCount = await tx.tip.count({
        where: { match: { matchday: { seasonId: parsedId.data } } },
      })
      if (tipCount > 0) {
        throw new Error('SEASON_HAS_TIPS')
      }

      // Dependency-ordered deletion is one operation: a failure must leave the
      // complete season intact rather than a partially emptied hierarchy.
      await tx.match.deleteMany({ where: { matchday: { seasonId: parsedId.data } } })
      await tx.matchday.deleteMany({ where: { seasonId: parsedId.data } })
      await tx.season.delete({ where: { id: parsedId.data } })
    })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.message === 'SEASON_HAS_TIPS') {
      return { error: 'Saison enthält bereits Tipps und kann nicht gelöscht werden' }
    }
    return { error: 'Saison konnte nicht gelöscht werden' }
  }
}

export async function setActiveSeason(seasonId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsedId = idSchema.safeParse(seasonId)
    if (!parsedId.success) return { error: 'Ungültige Saison' }

    // Deactivation and activation form one invariant: exactly the selected
    // season is active after the transaction commits.
    await prisma.$transaction(async (tx) => {
      await tx.season.updateMany({ data: { active: false } })
      await tx.season.update({ where: { id: parsedId.data }, data: { active: true } })
    }, { isolationLevel: 'Serializable' })
    return { success: true }
  } catch {
    return { error: 'Aktive Saison konnte nicht geändert werden' }
  }
}

const CreateMatchdaySchema = z.object({
  seasonId: idSchema,
  matchdayNumber: z.number().int().min(1).max(34),
  tippDeadline: deadlineSchema,
})

export async function createMatchday(
  data: z.infer<typeof CreateMatchdaySchema>,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = CreateMatchdaySchema.safeParse(data)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const { seasonId, matchdayNumber, tippDeadline } = parsed.data

    const existing = await prisma.matchday.findUnique({
      where: { seasonId_matchdayNumber: { seasonId, matchdayNumber } },
    })
    if (existing) return { error: 'Spieltag existiert bereits' }

    await prisma.matchday.create({
      data: { seasonId, matchdayNumber, tippDeadline: new Date(tippDeadline) },
    })
    return { success: true }
  } catch {
    return { error: 'Spieltag konnte nicht erstellt werden' }
  }
}

export async function setMatchdayStatus(
  matchdayId: string,
  status: MatchdayStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = z.object({ matchdayId: idSchema, status: matchdayStatusSchema }).safeParse({
      matchdayId,
      status,
    })
    if (!parsed.success) return { error: 'Ungültiger Spieltagsstatus' }

    await prisma.$transaction(async (tx) => {
      if (parsed.data.status === 'ACTIVE') {
        await tx.matchday.updateMany({
          where: { status: 'ACTIVE' },
          data: { status: 'CLOSED' },
        })
      }

      await tx.matchday.update({
        where: { id: parsed.data.matchdayId },
        data: { status: parsed.data.status },
      })
    }, { isolationLevel: 'Serializable' })
    return { success: true }
  } catch {
    return { error: 'Spieltagsstatus konnte nicht geändert werden' }
  }
}

export async function updateDeadline(
  matchdayId: string,
  deadline: string,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = z.object({ matchdayId: idSchema, deadline: deadlineSchema }).safeParse({
      matchdayId,
      deadline,
    })
    if (!parsed.success) return { error: 'Ungültige Deadline' }

    await prisma.$transaction(async (tx) => {
      const matchday = await tx.matchday.findUnique({
        where: { id: parsed.data.matchdayId },
        include: {
          matches: {
            orderBy: { matchDate: 'asc' },
            take: 1,
            select: { matchDate: true },
          },
        },
      })
      if (!matchday) throw new Error('MATCHDAY_NOT_FOUND')

      const effectiveDeadline = getEffectiveTipDeadline(
        matchday.tippDeadline,
        matchday.matches.map((match) => match.matchDate),
      )
      if (isDeadlinePassed(effectiveDeadline)) throw new Error('DEADLINE_LOCKED')

      const nextDeadline = new Date(parsed.data.deadline)
      const firstKickoff = matchday.matches[0]?.matchDate
      if (firstKickoff && nextDeadline > firstKickoff) {
        throw new Error('DEADLINE_AFTER_KICKOFF')
      }

      await tx.matchday.update({
        where: { id: parsed.data.matchdayId },
        data: { tippDeadline: nextDeadline },
      })
    }, { isolationLevel: 'Serializable' })
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'DEADLINE_LOCKED') {
      return { error: 'Eine bereits wirksame Deadline kann nicht wieder geöffnet werden' }
    }
    if (error instanceof Error && error.message === 'DEADLINE_AFTER_KICKOFF') {
      return { error: 'Die Deadline muss spätestens zum ersten Anstoß liegen' }
    }
    return { error: 'Deadline konnte nicht aktualisiert werden' }
  }
}

export async function setMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = z.object({ matchId: idSchema, homeScore: scoreSchema, awayScore: scoreSchema }).safeParse({
      matchId,
      homeScore,
      awayScore,
    })
    if (!parsed.success) return { error: 'Ungültiges Ergebnis' }

    // A manual score and all points derived from it must become visible
    // together; otherwise a failed recalculation would leave stale rankings.
    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: parsed.data.matchId },
        data: {
          homeScore: parsed.data.homeScore,
          awayScore: parsed.data.awayScore,
          status: 'COMPLETED',
        },
      })
      await recalculatePointsForMatchInTransaction(tx, parsed.data.matchId)
    })
    return { success: true }
  } catch {
    return { error: 'Ergebnis konnte nicht gespeichert werden' }
  }
}
