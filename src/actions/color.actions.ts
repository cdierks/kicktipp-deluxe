'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { requireAdmin } from '@/lib/auth-guards'
import { prisma } from '@/lib/prisma'

const hexSchema = z.string().regex(/^#[0-9a-f]{6}$/i)
const idSchema = z.string().min(1).max(191)

export async function setUserColor(hex: string | null) {
  const session = await getSession()
  if (!session?.user.id) return { error: 'Nicht angemeldet' }

  const parsedHex = hex === null ? null : hexSchema.safeParse(hex)
  if (parsedHex !== null && !parsedHex.success) return { error: 'Ungültige Farbe' }

  try {
    await prisma.$transaction(async (tx) => {
      let selectedHex = parsedHex === null ? null : parsedHex.data
      if (selectedHex !== null) {
        const entry = await tx.colorPalette.findUnique({ where: { hex: selectedHex } })
        if (!entry) throw new Error('COLOR_UNAVAILABLE')
        selectedHex = entry.hex

        const taken = await tx.user.findFirst({
          where: { color: selectedHex, NOT: { id: session.user.id } },
          select: { id: true },
        })
        if (taken) throw new Error('COLOR_TAKEN')
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { color: selectedHex },
      })
    }, { isolationLevel: 'Serializable' })
  } catch (error) {
    if (error instanceof Error && error.message === 'COLOR_UNAVAILABLE') {
      return { error: 'Farbe nicht verfügbar' }
    }
    if (error instanceof Error && error.message === 'COLOR_TAKEN') {
      return { error: 'Diese Farbe ist bereits vergeben' }
    }
    return { error: 'Farbe konnte nicht gespeichert werden' }
  }

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function addPaletteColor(formData: FormData) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Kein Zugriff' }
  }

  const rawHex = formData.get('hex')
  const rawLabel = formData.get('label')
  const hex = typeof rawHex === 'string' ? rawHex.trim().toLowerCase() : ''
  const label = typeof rawLabel === 'string' ? rawLabel.trim() : ''

  if (!hexSchema.safeParse(hex).success) return { error: 'Ungültiger Hex-Wert (z. B. #394eab)' }
  if (!label) return { error: 'Bezeichnung fehlt' }
  if (label.length > 50) return { error: 'Bezeichnung ist zu lang' }

  const maxOrder = await prisma.colorPalette.aggregate({ _max: { order: true } })
  const nextOrder = (maxOrder._max.order ?? -1) + 1

  try {
    await prisma.colorPalette.create({ data: { hex, label, order: nextOrder } })
  } catch {
    return { error: 'Farbe existiert bereits' }
  }

  revalidatePath('/admin/farben')
  return { success: true }
}

export async function removePaletteColor(id: string) {
  try {
    await requireAdmin()
  } catch {
    return { error: 'Kein Zugriff' }
  }

  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) return { error: 'Ungültige Farbe' }

  try {
    await prisma.$transaction(async (tx) => {
      const color = await tx.colorPalette.findUnique({ where: { id: parsedId.data } })
      if (!color) throw new Error('COLOR_NOT_FOUND')

      // Palette removal and user cleanup are one invariant; no account may
      // retain a color that is no longer selectable.
      await tx.user.updateMany({ where: { color: color.hex }, data: { color: null } })
      await tx.colorPalette.delete({ where: { id: parsedId.data } })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'COLOR_NOT_FOUND') {
      return { error: 'Farbe nicht gefunden' }
    }
    return { error: 'Farbe konnte nicht entfernt werden' }
  }

  revalidatePath('/admin/farben')
  revalidatePath('/profil')
  return { success: true }
}
