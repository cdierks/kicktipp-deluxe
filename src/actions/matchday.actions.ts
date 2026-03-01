'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { MatchdayStatus } from '@/generated/prisma/enums'

type ActionResult = { error?: string; success?: boolean }

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Nicht autorisiert')
  }
  return session
}

// --- Season ---

export async function createSeason(year: string): Promise<ActionResult & { season?: { id: string; year: string } }> {
  try {
    await requireAdmin()
    const existing = await prisma.season.findUnique({ where: { year } })
    if (existing) return { error: 'Saison existiert bereits' }
    const season = await prisma.season.create({ data: { year } })
    return { success: true, season }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function deleteSeason(seasonId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const tipCount = await prisma.tip.count({
      where: { match: { matchday: { seasonId } } },
    })
    if (tipCount > 0) return { error: 'Saison enthält bereits Tipps und kann nicht gelöscht werden' }
    // Delete in dependency order
    await prisma.match.deleteMany({ where: { matchday: { seasonId } } })
    await prisma.matchday.deleteMany({ where: { seasonId } })
    await prisma.season.delete({ where: { id: seasonId } })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function setActiveSeason(seasonId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    await prisma.season.updateMany({ data: { active: false } })
    await prisma.season.update({ where: { id: seasonId }, data: { active: true } })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

// --- Matchday ---

const CreateMatchdaySchema = z.object({
  seasonId: z.string(),
  matchdayNumber: z.number().int().min(1).max(34),
  tippDeadline: z.string().datetime(),
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function setMatchdayStatus(
  matchdayId: string,
  status: MatchdayStatus,
): Promise<ActionResult> {
  try {
    await requireAdmin()

    if (status === 'ACTIVE') {
      await prisma.matchday.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'CLOSED' },
      })
    }

    await prisma.matchday.update({ where: { id: matchdayId }, data: { status } })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function updateDeadline(
  matchdayId: string,
  deadline: string,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    await prisma.matchday.update({
      where: { id: matchdayId },
      data: { tippDeadline: new Date(deadline) },
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

// --- Manual score override ---

export async function setMatchScore(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<ActionResult> {
  try {
    await requireAdmin()
    await prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, status: 'COMPLETED' },
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}
