import 'server-only'

import { z } from 'zod'

const BASE_URL = 'https://api.openligadb.de'
const REQUEST_TIMEOUT_MS = 12_000

const openligaMatchSchema = z.object({
  matchID: z.number().int().positive(),
  matchDateTimeUTC: z.string().datetime({ offset: true }),
  team1: z.object({ teamName: z.string().min(1).max(191) }),
  team2: z.object({ teamName: z.string().min(1).max(191) }),
  matchResults: z.array(z.object({
    resultTypeID: z.number().int(),
    pointsTeam1: z.number().int().min(0).max(99),
    pointsTeam2: z.number().int().min(0).max(99),
  })).max(20),
  matchIsFinished: z.boolean(),
})

const openligaTableSchema = z.object({
  teamInfoId: z.number().int().positive(),
  shortName: z.string().min(1).max(255),
  teamName: z.string().min(1).max(255),
  teamIconUrl: z.string().max(2_048),
  points: z.number().int(),
  won: z.number().int().min(0),
  draw: z.number().int().min(0),
  lost: z.number().int().min(0),
  goals: z.number().int().min(0),
  opponentGoals: z.number().int().min(0),
  goalDiff: z.number().int(),
})

const seasonYearSchema = z.string().regex(/^\d{4}$/)

export interface OpenligaMatch {
  matchID: number
  matchDateTimeUTC: string
  team1: { teamName: string }
  team2: { teamName: string }
  matchResults: Array<{
    resultTypeID: number // 2 = final result
    pointsTeam1: number
    pointsTeam2: number
  }>
  matchIsFinished: boolean
}

export interface OpenligaTable {
  teamInfoId: number
  shortName: string
  teamName: string
  teamIconUrl: string
  points: number
  won: number
  draw: number
  lost: number
  goals: number
  opponentGoals: number
  goalDiff: number
}

export async function fetchMatchday(
  year: string,
  matchdayNumber: number,
): Promise<OpenligaMatch[]> {
  const parsedYear = seasonYearSchema.parse(year)
  const parsedMatchday = z.number().int().min(1).max(34).parse(matchdayNumber)
  const res = await fetch(
    `${BASE_URL}/getmatchdata/bl1/${parsedYear}/${parsedMatchday}`,
    {
      // A sync is a write source, not a display cache: every invocation must
      // observe the provider's latest correction before advancing syncedAt.
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  )
  if (!res.ok) throw new Error(`OpenLigaDB error: ${res.status}`)
  return z.array(openligaMatchSchema).max(20).parse(await res.json())
}

export async function fetchTable(
  year: string,
  options?: RequestInit,
): Promise<OpenligaTable[]> {
  const parsedYear = seasonYearSchema.parse(year)
  const res = await fetch(`${BASE_URL}/getbltable/bl1/${parsedYear}`, {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`OpenLigaDB table error: ${res.status}`)
  return z.array(openligaTableSchema).max(30).parse(await res.json())
}

export function extractScore(
  match: OpenligaMatch,
): { home: number | null; away: number | null } {
  if (!match.matchIsFinished) return { home: null, away: null }
  const finalResult = match.matchResults.find((r) => r.resultTypeID === 2)
  if (!finalResult) return { home: null, away: null }
  return { home: finalResult.pointsTeam1, away: finalResult.pointsTeam2 }
}
