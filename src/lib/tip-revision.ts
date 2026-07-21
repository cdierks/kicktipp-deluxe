export interface TipRevisionEntry {
  matchId: string
  homeScore: number
  awayScore: number
  isJoker: boolean
}

/** Exact canonical snapshot used for optimistic tip-write concurrency checks. */
export function createTipRevision(tips: TipRevisionEntry[]) {
  return JSON.stringify(
    [...tips]
      .sort((left, right) => left.matchId.localeCompare(right.matchId))
      .map((tip) => [tip.matchId, tip.homeScore, tip.awayScore, tip.isJoker ? 1 : 0]),
  )
}
