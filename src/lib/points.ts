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

  // Correct outcome determination
  const tipOutcome = Math.sign(tipDiff)
  const actualOutcome = Math.sign(actualDiff)

  if (tipOutcome !== actualOutcome) return 0

  // Correct outcome
  let base: number
  if (tipHome === actualHome && tipAway === actualAway) base = 4 // exact
  else if (tipDiff === actualDiff) base = 3 // correct goal difference
  else base = 2 // correct outcome only

  return isJoker ? base * 2 : base
}
