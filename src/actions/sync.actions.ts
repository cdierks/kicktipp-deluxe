'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guards'
import { syncMatchdayById } from '@/lib/matchday-sync'

export async function syncMatchday(matchdayId: string) {
  try {
    await requireAdmin()
    const parsedId = z.string().min(1).max(191).safeParse(matchdayId)
    if (!parsedId.success) return { error: 'Ungültiger Spieltag' }
    return await syncMatchdayById(parsedId.data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Spieltag nicht gefunden') {
      return { error: error.message }
    }
    return { error: 'OpenLigaDB-Synchronisierung fehlgeschlagen' }
  }
}
