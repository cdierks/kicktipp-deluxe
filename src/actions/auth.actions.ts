'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getRegistrationEnabled } from '@/lib/settings'
import { consumeRateLimit, normalizeRequestIp } from '@/lib/rate-limit'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(191, 'E-Mail-Adresse ist zu lang')
  .email('Ungültige E-Mail-Adresse')

const newPasswordSchema = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen haben')
  .max(128, 'Passwort ist zu lang')
  .refine(
    (password) => new TextEncoder().encode(password).byteLength <= 72,
    'Passwort darf in UTF-8 maximal 72 Bytes lang sein',
  )

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Vor- und Nachname muss mindestens 2 Zeichen haben')
  .max(100, 'Vor- und Nachname darf maximal 100 Zeichen haben')

const nicknameSchema = z
  .string()
  .trim()
  .min(2, 'Spitzname muss mindestens 2 Zeichen haben')
  .max(20, 'Spitzname darf maximal 20 Zeichen haben')
  .regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und Unterstriche erlaubt')

const favoriteTeamSchema = z.string().trim().max(120, 'Vereinsname ist zu lang').optional()

const RegisterSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  name: nameSchema,
  nickname: nicknameSchema,
  favoriteTeam: favoriteTeamSchema,
})

export type RegisterInput = z.infer<typeof RegisterSchema>

async function allowSensitiveAccountAction(action: string, userId: string) {
  const requestHeaders = await headers()
  const requestIp = normalizeRequestIp(
    requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for'),
  )
  return consumeRateLimit(`${action}:${userId}:${requestIp}`, 8, 15 * 60_000)
}

export async function registerUser(data: RegisterInput) {
  const requestHeaders = await headers()
  const requestIp = normalizeRequestIp(
    requestHeaders.get('x-real-ip') ?? requestHeaders.get('x-forwarded-for'),
  )
  if (!consumeRateLimit(`register:${requestIp}`, 5, 15 * 60_000)) {
    return { error: 'Zu viele Registrierungsversuche. Bitte später erneut versuchen.' }
  }

  const regEnabled = await getRegistrationEnabled()
  if (!regEnabled) return { error: 'Die Registrierung ist derzeit deaktiviert.' }

  const parsed = RegisterSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password, name, nickname, favoriteTeam } = parsed.data

  // Hash before the uniqueness check performed by the database so existing
  // accounts and new registrations have comparable response timing.
  const passwordHash = await bcrypt.hash(password, 12)
  try {
    await prisma.user.create({
      data: { email, passwordHash, name, nickname, favoriteTeam: favoriteTeam || null },
    })
  } catch (error) {
    // The database constraints are the final arbiter when registrations race.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { error: 'E-Mail oder Spitzname bereits vergeben' }
    }
    throw error
  }

  return { success: true }
}

const ProfileSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  nickname: nicknameSchema,
  favoriteTeam: favoriteTeamSchema,
  currentPassword: z.string().max(1024, 'Passwort ist zu lang').optional(),
})

export async function updateProfile(data: z.infer<typeof ProfileSchema>) {
  const session = await getSession()
  if (!session?.user.id) return { error: 'Nicht angemeldet' }

  const userId = session.user.id
  const parsed = ProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, name, nickname, favoriteTeam, currentPassword } = parsed.data

  const existingNickname = await prisma.user.findFirst({
    where: { nickname, NOT: { id: userId } },
  })
  if (existingNickname) return { error: 'Spitzname bereits vergeben' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true },
  })
  if (!user) return { error: 'Benutzer nicht gefunden' }

  const normalizedEmail = email
  const emailChanged = normalizedEmail !== user.email.toLowerCase()

  if (emailChanged) {
    if (!currentPassword) return { error: 'Bitte gib dein aktuelles Passwort ein, um die E-Mail zu ändern' }
    if (!(await allowSensitiveAccountAction('profile-email', userId))) {
      return { error: 'Zu viele Bestätigungsversuche. Bitte später erneut versuchen.' }
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!validPassword) return { error: 'Aktuelles Passwort falsch' }

    const existingEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail, NOT: { id: userId } },
      select: { id: true },
    })
    if (existingEmail) return { error: 'E-Mail bereits registriert' }
  }

  let updatedUser
  try {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        name,
        nickname,
        favoriteTeam: favoriteTeam || null,
      },
      select: {
        email: true,
        name: true,
        nickname: true,
        favoriteTeam: true,
      },
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { error: 'E-Mail oder Spitzname bereits vergeben' }
    }
    throw error
  }

  return { success: true, user: updatedUser }
}

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort fehlt').max(1024, 'Passwort ist zu lang'),
  newPassword: newPasswordSchema,
})

export async function changePassword(data: z.infer<typeof PasswordSchema>) {
  const session = await getSession()
  if (!session?.user.id) return { error: 'Nicht angemeldet' }

  const userId = session.user.id
  const parsed = PasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  if (!(await allowSensitiveAccountAction('password-change', userId))) {
    return { error: 'Zu viele Bestätigungsversuche. Bitte später erneut versuchen.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden' }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return { error: 'Aktuelles Passwort falsch' }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  return { success: true }
}
