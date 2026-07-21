/** Returns the configured deadline or first kickoff, whichever occurs first. */
export function getEffectiveTipDeadline(deadline: Date, matchDates: Date[]) {
  if (matchDates.length === 0) return deadline
  const firstKickoff = Math.min(...matchDates.map((date) => date.getTime()))
  return new Date(Math.min(deadline.getTime(), firstKickoff))
}

export function isDeadlinePassed(deadline: Date, now = new Date()): boolean {
  return now >= deadline
}
