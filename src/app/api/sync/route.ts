import { timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { syncActiveMatchday } from '@/lib/matchday-sync'
import { serverEnv } from '@/lib/env'

function hasValidCronSecret(provided: string | null) {
  if (!provided) return false

  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(serverEnv.CRON_SECRET)
  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer)
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!hasValidCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncActiveMatchday()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: 'Synchronisierung fehlgeschlagen' },
      { status: 500 },
    )
  }
}
