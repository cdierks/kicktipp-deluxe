'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-guards'
import {
  recalculateAllPointsForMatchday as recalculateAllPointsForMatchdayInternal,
  recalculatePointsForMatch as recalculatePointsForMatchInternal,
} from '@/lib/point-recalculation'

type ActionResult = { error?: string; success?: boolean; skipped?: boolean; updatedTips?: number }

export async function recalculatePointsForMatch(matchId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsedId = z.string().min(1).max(191).safeParse(matchId)
    if (!parsedId.success) return { error: 'Ungültiges Spiel' }

    const result = await recalculatePointsForMatchInternal(parsedId.data)
    return result.skipped
      ? { skipped: true }
      : { success: true, updatedTips: result.updatedTips }
  } catch {
    return { error: 'Punkte konnten nicht neu berechnet werden' }
  }
}

export async function recalculateAllPointsForMatchday(matchdayId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsedId = z.string().min(1).max(191).safeParse(matchdayId)
    if (!parsedId.success) return { error: 'Ungültiger Spieltag' }

    const result = await recalculateAllPointsForMatchdayInternal(parsedId.data)
    return { success: true, updatedTips: result.updatedTips }
  } catch {
    return { error: 'Punkte konnten nicht neu berechnet werden' }
  }
}
