'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guards'
import { Role } from '@/generated/prisma/enums'
import { MatchStatus, MatchdayStatus } from '@/generated/prisma/enums'
import { consumeRateLimit, normalizeRequestIp } from '@/lib/rate-limit'
import { calculatePoints } from '@/lib/points'

const isoDate = z.string().datetime()
const id = z.string().min(1).max(191)
const dbText = z.string().max(191)
const bcryptHash = z.string().regex(
  /^\$2[aby]\$(?:1[0-4])\$[./A-Za-z0-9]{53}$/,
  'Ungültiger Passwort-Hash',
)
const MAX_BACKUP_BYTES = 10 * 1024 * 1024
const passwordConfirmationSchema = z.string().min(1).max(1024)

const backupSchema = z.object({
  exportedAt: isoDate,
  version: z.literal(1),
  users: z.array(z.object({
    id,
    email: z.string().max(191).email(),
    passwordHash: bcryptHash,
    name: dbText,
    nickname: z.string().min(2).max(20).regex(/^[A-Za-z0-9_]+$/),
    favoriteTeam: dbText.nullable(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
    role: z.nativeEnum(Role),
    createdAt: isoDate,
    updatedAt: isoDate,
  })).max(10_000),
  colorPalettes: z.array(z.object({
    id,
    hex: z.string().regex(/^#[0-9a-f]{6}$/i),
    label: z.string().min(1).max(50),
    order: z.number().int(),
  })).max(1_000),
  seasons: z.array(z.object({
    id,
    year: z.string().regex(/^\d{4}$/),
    active: z.boolean(),
  })).max(100),
  matchdays: z.array(z.object({
    id,
    seasonId: id,
    matchdayNumber: z.number().int().min(1).max(34),
    status: z.nativeEnum(MatchdayStatus),
    tippDeadline: isoDate,
    syncedAt: isoDate.nullable(),
  })).max(5_000),
  matches: z.array(z.object({
    id,
    matchdayId: id,
    homeTeam: dbText,
    awayTeam: dbText,
    homeScore: z.number().int().min(0).max(99).nullable(),
    awayScore: z.number().int().min(0).max(99).nullable(),
    matchDate: isoDate,
    openligaMatchId: z.number().int(),
    status: z.nativeEnum(MatchStatus),
  })).max(50_000),
  tips: z.array(z.object({
    id,
    userId: id,
    matchId: id,
    homeScore: z.number().int().min(0).max(99),
    awayScore: z.number().int().min(0).max(99),
    points: z.number().int().min(0).max(8).nullable(),
    isJoker: z.boolean(),
  })).max(1_000_000),
  appSettings: z.array(z.object({
    key: id,
    value: dbText,
  })).max(1_000),
})

type AppBackup = z.infer<typeof backupSchema>

function hasDuplicates<T>(values: T[]) {
  return new Set(values).size !== values.length
}

/**
 * Validates relationships and uniqueness rules that Zod cannot express in the
 * structural schema. Export and import share this gate so every generated file
 * is guaranteed to be accepted by the restore path.
 */
function validateBackupInvariants(backup: AppBackup): string | null {
  if (!backup.users.some((user) => user.role === 'ADMIN')) return 'Backup enthält keinen Admin-Benutzer'
  if (backup.seasons.filter((season) => season.active).length > 1) return 'Backup enthält mehrere aktive Saisons'
  if (backup.matchdays.filter((matchday) => matchday.status === 'ACTIVE').length > 1) return 'Backup enthält mehrere aktive Spieltage'

  const assignedColors = backup.users
    .map((user) => user.color?.toLowerCase())
    .filter((color): color is string => Boolean(color))
  if (hasDuplicates(assignedColors)) return 'Backup weist dieselbe Spielerfarbe mehrfach zu'

  const registrationSettings = backup.appSettings.filter((setting) => setting.key === 'registrationEnabled')
  if (registrationSettings.length !== 1 || !/^(?:true|false)$/.test(registrationSettings[0].value)) {
    return 'Backup enthält keine gültige Registrierungseinstellung'
  }

  const uniqueGroups: Array<[unknown[], string]> = [
    [backup.users.map((user) => user.id), 'Benutzer-IDs'],
    [backup.users.map((user) => user.email.toLowerCase()), 'E-Mail-Adressen'],
    [backup.users.map((user) => user.nickname.toLowerCase()), 'Spitznamen'],
    [backup.colorPalettes.map((color) => color.id), 'Farb-IDs'],
    [backup.colorPalettes.map((color) => color.hex.toLowerCase()), 'Farben'],
    [backup.seasons.map((season) => season.id), 'Saison-IDs'],
    [backup.seasons.map((season) => season.year), 'Saisonjahre'],
    [backup.matchdays.map((matchday) => matchday.id), 'Spieltag-IDs'],
    [backup.matchdays.map((matchday) => `${matchday.seasonId}:${matchday.matchdayNumber}`), 'Spieltage'],
    [backup.matches.map((match) => match.id), 'Spiel-IDs'],
    [backup.matches.map((match) => match.openligaMatchId), 'OpenLigaDB-IDs'],
    [backup.tips.map((tip) => tip.id), 'Tipp-IDs'],
    [backup.tips.map((tip) => `${tip.userId}:${tip.matchId}`), 'Benutzer-Tipps'],
    [backup.appSettings.map((setting) => setting.key), 'App-Einstellungen'],
  ]
  const duplicateGroup = uniqueGroups.find(([values]) => hasDuplicates(values))
  if (duplicateGroup) return `Backup enthält doppelte ${duplicateGroup[1]}`

  const userIds = new Set(backup.users.map((user) => user.id))
  const seasonIds = new Set(backup.seasons.map((season) => season.id))
  const matchdayIds = new Set(backup.matchdays.map((matchday) => matchday.id))
  const matchIds = new Set(backup.matches.map((match) => match.id))
  const paletteColors = new Set(backup.colorPalettes.map((color) => color.hex.toLowerCase()))

  if (backup.users.some((user) => user.color && !paletteColors.has(user.color.toLowerCase()))) {
    return 'Backup enthält eine Spielerfarbe außerhalb der Farbpalette'
  }
  if (backup.matchdays.some((matchday) => !seasonIds.has(matchday.seasonId))) {
    return 'Backup enthält einen Spieltag ohne Saison'
  }
  if (backup.matches.some((match) => !matchdayIds.has(match.matchdayId))) {
    return 'Backup enthält ein Spiel ohne Spieltag'
  }
  if (backup.matches.some((match) => (match.homeScore === null) !== (match.awayScore === null))) {
    return 'Backup enthält ein unvollständiges Spielergebnis'
  }
  if (backup.tips.some((tip) => !userIds.has(tip.userId) || !matchIds.has(tip.matchId))) {
    return 'Backup enthält einen Tipp ohne Benutzer oder Spiel'
  }

  const matchById = new Map(backup.matches.map((match) => [match.id, match]))
  for (const tip of backup.tips) {
    const match = matchById.get(tip.matchId)
    if (!match) continue
    const expectedPoints = match.homeScore === null || match.awayScore === null
      ? null
      : calculatePoints(
          tip.homeScore,
          tip.awayScore,
          match.homeScore,
          match.awayScore,
          tip.isJoker,
        )
    if (tip.points !== expectedPoints) return 'Backup enthält inkonsistente Tipp-Punkte'
  }

  const matchdayByMatch = new Map(backup.matches.map((match) => [match.id, match.matchdayId]))
  const jokerGroups = backup.tips
    .filter((tip) => tip.isJoker)
    .map((tip) => `${tip.userId}:${matchdayByMatch.get(tip.matchId)}`)
  if (hasDuplicates(jokerGroups)) return 'Backup enthält mehrere Joker eines Benutzers am selben Spieltag'

  return null
}

async function verifyAdminStepUp(adminId: string, password: string) {
  const parsedPassword = passwordConfirmationSchema.safeParse(password)
  if (!parsedPassword.success) return 'Aktuelles Passwort ist erforderlich'

  const requestHeaders = await headers()
  const requestIp = normalizeRequestIp(
    requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for'),
  )
  if (!consumeRateLimit(`admin-backup:${adminId}:${requestIp}`, 8, 15 * 60_000)) {
    return 'Zu viele Bestätigungsversuche. Bitte später erneut versuchen.'
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { passwordHash: true },
  })
  if (!user || !(await bcrypt.compare(parsedPassword.data, user.passwordHash))) {
    return 'Aktuelles Passwort ist falsch'
  }
  return null
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const admin = await requireAdmin()
    const parsed = z.object({ userId: id, role: z.nativeEnum(Role) }).safeParse({ userId, role })
    if (!parsed.success) return { error: 'Ungültige Rolle' }
    if (parsed.data.userId === admin.id && parsed.data.role !== 'ADMIN') {
      return { error: 'Die eigene Adminrolle kann nicht entfernt werden' }
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { role: true },
      })
      if (!target) throw new Error('USER_NOT_FOUND')

      if (target.role === 'ADMIN' && parsed.data.role === 'USER') {
        const adminCount = await tx.user.count({ where: { role: 'ADMIN' } })
        if (adminCount <= 1) throw new Error('LAST_ADMIN')
      }

      await tx.user.update({
        where: { id: parsed.data.userId },
        data: { role: parsed.data.role },
      })
    }, { isolationLevel: 'Serializable' })
    return { success: true }
  } catch (e) {
    if (e instanceof Error && e.message === 'USER_NOT_FOUND') return { error: 'Benutzer nicht gefunden' }
    if (e instanceof Error && e.message === 'LAST_ADMIN') return { error: 'Der letzte Admin kann nicht herabgestuft werden' }
    return { error: 'Rolle konnte nicht geändert werden' }
  }
}

export async function setRegistrationEnabled(
  enabled: boolean,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireAdmin()
    const parsedEnabled = z.boolean().safeParse(enabled)
    if (!parsedEnabled.success) return { error: 'Ungültiger Registrierungsstatus' }
    await prisma.appSetting.upsert({
      where:  { key: 'registrationEnabled' },
      update: { value: String(parsedEnabled.data) },
      create: { key: 'registrationEnabled', value: String(parsedEnabled.data) },
    })
    revalidatePath('/admin')
    return { success: true }
  } catch {
    return { error: 'Registrierung konnte nicht geändert werden' }
  }
}

export async function exportAppBackup(currentPassword: string): Promise<
  | { error: string }
  | {
      success: true
      backup: z.infer<typeof backupSchema>
    }
> {
  try {
    const admin = await requireAdmin()
    const stepUpError = await verifyAdminStepUp(admin.id, currentPassword)
    if (stepUpError) return { error: stepUpError }

    // A repeatable-read snapshot prevents relationships from changing between
    // table reads and producing a backup that cannot be restored.
    const [users, colorPalettes, seasons, matchdays, matches, tips, appSettings] = await prisma.$transaction([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.colorPalette.findMany({ orderBy: [{ order: 'asc' }, { hex: 'asc' }] }),
      prisma.season.findMany({ orderBy: { year: 'asc' } }),
      prisma.matchday.findMany({ orderBy: [{ seasonId: 'asc' }, { matchdayNumber: 'asc' }] }),
      prisma.match.findMany({ orderBy: [{ matchdayId: 'asc' }, { matchDate: 'asc' }] }),
      prisma.tip.findMany({ orderBy: [{ userId: 'asc' }, { matchId: 'asc' }] }),
      prisma.appSetting.findMany({ orderBy: { key: 'asc' } }),
    ], { isolationLevel: 'RepeatableRead' })

    const backup: AppBackup = {
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
    }

    const parsedBackup = backupSchema.safeParse(backup)
    if (!parsedBackup.success) return { error: 'Datenbestand kann nicht konsistent exportiert werden' }
    const invariantError = validateBackupInvariants(parsedBackup.data)
    if (invariantError) return { error: invariantError }

    if (new TextEncoder().encode(JSON.stringify(backup)).byteLength > MAX_BACKUP_BYTES) {
      return { error: 'Backup ist größer als 10 MB und kann nicht sicher übertragen werden' }
    }

    return { success: true, backup }
  } catch {
    return { error: 'Fehler beim Export' }
  }
}

export async function importAppBackup(
  rawBackup: string,
  currentPassword: string,
): Promise<{ error?: string; success?: boolean; summary?: { seasons: number; matchdays: number; matches: number; tips: number } }> {
  try {
    const admin = await requireAdmin()
    const stepUpError = await verifyAdminStepUp(admin.id, currentPassword)
    if (stepUpError) return { error: stepUpError }

    if (new TextEncoder().encode(rawBackup).byteLength > MAX_BACKUP_BYTES) {
      return { error: 'Backup-Datei ist größer als 10 MB' }
    }

    const parsedJson = JSON.parse(rawBackup)
    const parsed = backupSchema.safeParse(parsedJson)
    if (!parsed.success) {
      return { error: 'Ungültige Backup-Datei' }
    }

    const backup = parsed.data
    const invariantError = validateBackupInvariants(backup)
    if (invariantError) return { error: invariantError }

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
    }, { maxWait: 10_000, timeout: 120_000 })

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
  } catch {
    return { error: 'Fehler beim Import' }
  }
}
