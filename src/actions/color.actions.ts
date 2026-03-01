'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** User sets their own color (null = remove) */
export async function setUserColor(hex: string | null) {
  const session = await getSession()
  if (!session) return { error: 'Nicht angemeldet' }

  if (hex !== null) {
    // Verify hex exists in palette
    const entry = await prisma.colorPalette.findUnique({ where: { hex } })
    if (!entry) return { error: 'Farbe nicht verfügbar' }

    // Check it's not already taken by another user
    const taken = await prisma.user.findFirst({
      where: { color: hex, NOT: { id: session.user.id } },
      select: { id: true },
    })
    if (taken) return { error: 'Diese Farbe ist bereits vergeben' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { color: hex },
  })

  revalidatePath('/profil')
  revalidatePath('/dashboard')
  return { success: true }
}

/** Admin: add a new color to the palette */
export async function addPaletteColor(formData: FormData) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Kein Zugriff' }

  const hex = (formData.get('hex') as string ?? '').trim().toLowerCase()
  const label = (formData.get('label') as string ?? '').trim()

  if (!/^#[0-9a-f]{6}$/.test(hex)) return { error: 'Ungültiger Hex-Wert (z.B. #2a61a1)' }
  if (!label) return { error: 'Bezeichnung fehlt' }

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

/** Admin: remove a color from the palette (unsets it from any user who had it) */
export async function removePaletteColor(id: string) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Kein Zugriff' }

  const color = await prisma.colorPalette.findUnique({ where: { id } })
  if (!color) return { error: 'Farbe nicht gefunden' }

  // Free the color from any user who has it
  await prisma.user.updateMany({ where: { color: color.hex }, data: { color: null } })
  await prisma.colorPalette.delete({ where: { id } })

  revalidatePath('/admin/farben')
  revalidatePath('/profil')
  return { success: true }
}
