const BASE_URL = 'https://api.openligadb.de'

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
  const res = await fetch(
    `${BASE_URL}/getmatchdata/bl1/${year}/${matchdayNumber}`,
    { next: { revalidate: 300 } }, // 5 min cache
  )
  if (!res.ok) throw new Error(`OpenLigaDB error: ${res.status}`)
  return res.json()
}

export async function fetchTable(
  year: string,
  options?: RequestInit,
): Promise<OpenligaTable[]> {
  const res = await fetch(`${BASE_URL}/getbltable/bl1/${year}`, options)
  if (!res.ok) throw new Error(`OpenLigaDB table error: ${res.status}`)
  return res.json()
}

export function extractScore(
  match: OpenligaMatch,
): { home: number | null; away: number | null } {
  if (!match.matchIsFinished) return { home: null, away: null }
  const finalResult = match.matchResults.find((r) => r.resultTypeID === 2)
  if (!finalResult) return { home: null, away: null }
  return { home: finalResult.pointsTeam1, away: finalResult.pointsTeam2 }
}
