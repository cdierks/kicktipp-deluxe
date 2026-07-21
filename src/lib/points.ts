/**
 * Pure points calculation – no DB dependencies, fully testable.
 *
 * Kicktipp scoring:
 *   Exact result (2:0 → 2:0)          = 4 pts
 *   Correct goal difference (2:0→3:1)  = 3 pts
 *   Correct outcome (2:0 → 1:0)        = 2 pts
 *   Wrong outcome                       = 0 pts
 */
export function calculatePoints(
  tipHome: number,
  tipAway: number,
  actualHome: number,
  actualAway: number,
  isJoker = false,
): number {
  const tipDiff = tipHome - tipAway
  const actualDiff = actualHome - actualAway

  // The sign encodes home win, draw, and away win without branching three times.
  const tipOutcome = Math.sign(tipDiff)
  const actualOutcome = Math.sign(actualDiff)

  if (tipOutcome !== actualOutcome) return 0

  let base: number
  if (tipHome === actualHome && tipAway === actualAway) base = 4
  else if (tipDiff === actualDiff) base = 3
  else base = 2

  // A Joker doubles only a successful base score; misses have returned above.
  return isJoker ? base * 2 : base
}
