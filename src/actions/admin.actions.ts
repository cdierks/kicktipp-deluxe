'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Role } from '@/generated/prisma/enums'
import { MatchStatus, MatchdayStatus } from '@/generated/prisma/enums'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Nicht autorisiert')
}

const isoDate = z.string().datetime()

const backupSchema = z.object({
  exportedAt: isoDate,
  version: z.literal(1),
  users: z.array(z.object({
    id: z.string(),
    email: z.string().email(),
    passwordHash: z.string(),
    name: z.string(),
    nickname: z.string(),
    favoriteTeam: z.string().nullable(),
    color: z.string().nullable(),
    role: z.nativeEnum(Role),
    createdAt: isoDate,
    updatedAt: isoDate,
  })),
  colorPalettes: z.array(z.object({
    id: z.string(),
    hex: z.string(),
    label: z.string(),
    order: z.number().int(),
  })),
  seasons: z.array(z.object({
    id: z.string(),
    year: z.string(),
    active: z.boolean(),
  })),
  matchdays: z.array(z.object({
    id: z.string(),
    seasonId: z.string(),
    matchdayNumber: z.number().int(),
    status: z.nativeEnum(MatchdayStatus),
    tippDeadline: isoDate,
    syncedAt: isoDate.nullable(),
  })),
  matches: z.array(z.object({
    id: z.string(),
    matchdayId: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    homeScore: z.number().int().nullable(),
    awayScore: z.number().int().nullable(),
    matchDate: isoDate,
    openligaMatchId: z.number().int(),
    status: z.nativeEnum(MatchStatus),
  })),
  tips: z.array(z.object({
    id: z.string(),
    userId: z.string(),
    matchId: z.string(),
    homeScore: z.number().int(),
    awayScore: z.number().int(),
    points: z.number().int().nullable(),
    isJoker: z.boolean(),
  })),
  appSettings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
})

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    await prisma.user.update({ where: { id: userId }, data: { role } })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function setRegistrationEnabled(
  enabled: boolean,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    await prisma.appSetting.upsert({
      where:  { key: 'registrationEnabled' },
      update: { value: String(enabled) },
      create: { key: 'registrationEnabled', value: String(enabled) },
    })
    revalidatePath('/admin')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler' }
  }
}

export async function exportAppBackup(): Promise<
  | { error: string }
  | {
      success: true
      backup: z.infer<typeof backupSchema>
    }
> {
  try {
    await requireAdmin()

    const [users, colorPalettes, seasons, matchdays, matches, tips, appSettings] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.colorPalette.findMany({ orderBy: [{ order: 'asc' }, { hex: 'asc' }] }),
      prisma.season.findMany({ orderBy: { year: 'asc' } }),
      prisma.matchday.findMany({ orderBy: [{ seasonId: 'asc' }, { matchdayNumber: 'asc' }] }),
      prisma.match.findMany({ orderBy: [{ matchdayId: 'asc' }, { matchDate: 'asc' }] }),
      prisma.tip.findMany({ orderBy: [{ userId: 'asc' }, { matchId: 'asc' }] }),
      prisma.appSetting.findMany({ orderBy: { key: 'asc' } }),
    ])

    return {
      success: true,
      backup: {
        version: 1,
        exportedAt: new Date().toISOString(),
        users: users.map((user) => ({
          ...user,
          favoriteTeam: user.favoriteTeam ?? null,
          color: user.color ?? null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })),
        colorPalettes,
        seasons,
        matchdays: matchdays.map((matchday) => ({
          ...matchday,
          tippDeadline: matchday.tippDeadline.toISOString(),
          syncedAt: matchday.syncedAt?.toISOString() ?? null,
        })),
        matches: matches.map((match) => ({
          ...match,
          homeScore: match.homeScore ?? null,
          awayScore: match.awayScore ?? null,
          matchDate: match.matchDate.toISOString(),
        })),
        tips: tips.map((tip) => ({
          ...tip,
          points: tip.points ?? null,
        })),
        appSettings,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler beim Export' }
  }
}

export async function importAppBackup(
  rawBackup: string,
): Promise<{ error?: string; success?: boolean; summary?: { seasons: number; matchdays: number; matches: number; tips: number } }> {
  try {
    await requireAdmin()

    const parsedJson = JSON.parse(rawBackup)
    const parsed = backupSchema.safeParse(parsedJson)
    if (!parsed.success) {
      return { error: 'Ungültige Backup-Datei' }
    }

    const backup = parsed.data

    await prisma.$transaction(async (tx) => {
      await tx.tip.deleteMany()
      await tx.match.deleteMany()
      await tx.matchday.deleteMany()
      await tx.season.deleteMany()
      await tx.user.deleteMany()
      await tx.colorPalette.deleteMany()
      await tx.appSetting.deleteMany()

      if (backup.users.length > 0) {
        await tx.user.createMany({
          data: backup.users.map((user) => ({
            ...user,
            favoriteTeam: user.favoriteTeam ?? undefined,
            color: user.color ?? undefined,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          })),
        })
      }

      if (backup.colorPalettes.length > 0) {
        await tx.colorPalette.createMany({ data: backup.colorPalettes })
      }

      if (backup.seasons.length > 0) {
        await tx.season.createMany({ data: backup.seasons })
      }

      if (backup.matchdays.length > 0) {
        await tx.matchday.createMany({
          data: backup.matchdays.map((matchday) => ({
            ...matchday,
            tippDeadline: new Date(matchday.tippDeadline),
            syncedAt: matchday.syncedAt ? new Date(matchday.syncedAt) : null,
          })),
        })
      }

      if (backup.matches.length > 0) {
        await tx.match.createMany({
          data: backup.matches.map((match) => ({
            ...match,
            homeScore: match.homeScore ?? undefined,
            awayScore: match.awayScore ?? undefined,
            matchDate: new Date(match.matchDate),
          })),
        })
      }

      if (backup.tips.length > 0) {
        await tx.tip.createMany({
          data: backup.tips.map((tip) => ({
            ...tip,
            points: tip.points ?? undefined,
          })),
        })
      }

      if (backup.appSettings.length > 0) {
        await tx.appSetting.createMany({ data: backup.appSettings })
      }
    })

    revalidatePath('/admin')
    revalidatePath('/admin/spieltage')
    revalidatePath('/admin/ergebnisse')
    revalidatePath('/admin/benutzer')
    revalidatePath('/admin/farben')
    revalidatePath('/dashboard')

    return {
      success: true,
      summary: {
        seasons: backup.seasons.length,
        matchdays: backup.matchdays.length,
        matches: backup.matches.length,
        tips: backup.tips.length,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler beim Import' }
  }
}
