interface ExistingTargetMatch {
  id: string
  openligaMatchId: number
  tipCount: number
}

/** Validates the provider snapshot before it is allowed near persisted data. */
export function validateProviderMatchday(
  matchIds: readonly number[],
  teams: readonly string[],
) {
  if (
    matchIds.length !== 9
    || teams.length !== 18
    || new Set(matchIds).size !== 9
    || new Set(teams).size !== 18
  ) {
    throw new Error('OpenLigaDB lieferte keinen vollständigen Spieltag')
  }
}

/**
 * Plans the only safe reconciliation for fixtures already stored on a target
 * matchday. Provider IDs may never move between matchdays, and obsolete rows
 * may only be removed while no user tip references them.
 */
export function planMatchdayReconciliation({
  providerMatchIds,
  foreignProviderMatchCount,
  existingTargetMatches,
}: {
  providerMatchIds: readonly number[]
  foreignProviderMatchCount: number
  existingTargetMatches: readonly ExistingTargetMatch[]
}) {
  if (foreignProviderMatchCount > 0) {
    throw new Error('OpenLigaDB-Spiele sind bereits einem anderen Spieltag zugeordnet')
  }

  const providerIdSet = new Set(providerMatchIds)
  const staleMatches = existingTargetMatches.filter(
    (match) => !providerIdSet.has(match.openligaMatchId),
  )
  if (staleMatches.some((match) => match.tipCount > 0)) {
    throw new Error('Der bestehende Spieltag enthält abweichende Spiele mit Tipps')
  }

  return staleMatches.map((match) => match.id)
}
