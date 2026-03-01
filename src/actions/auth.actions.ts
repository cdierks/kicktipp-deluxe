'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const RegisterSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  nickname: z
    .string()
    .min(2, 'Nickname muss mindestens 2 Zeichen haben')
    .max(20, 'Nickname darf maximal 20 Zeichen haben')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und Unterstriche erlaubt'),
  favoriteTeam: z.string().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>

export async function registerUser(data: RegisterInput) {
  const parsed = RegisterSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, password, name, nickname, favoriteTeam } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  })
  if (existing) {
    if (existing.email === email) return { error: 'E-Mail bereits registriert' }
    return { error: 'Nickname bereits vergeben' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { email, passwordHash, name, nickname, favoriteTeam: favoriteTeam || null },
  })

  return { success: true }
}

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  nickname: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  favoriteTeam: z.string().optional(),
})

export async function updateProfile(
  userId: string,
  data: z.infer<typeof ProfileSchema>,
) {
  const parsed = ProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { name, nickname, favoriteTeam } = parsed.data

  const existingNickname = await prisma.user.findFirst({
    where: { nickname, NOT: { id: userId } },
  })
  if (existingNickname) return { error: 'Nickname bereits vergeben' }

  await prisma.user.update({
    where: { id: userId },
    data: { name, nickname, favoriteTeam: favoriteTeam || null },
  })

  return { success: true }
}

const PasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
})

export async function changePassword(
  userId: string,
  data: z.infer<typeof PasswordSchema>,
) {
  const parsed = PasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden' }

  const valid = await bcrypt.compare(data.currentPassword, user.passwordHash)
  if (!valid) return { error: 'Aktuelles Passwort falsch' }

  const passwordHash = await bcrypt.hash(data.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })

  return { success: true }
}
