import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getDashboardBasePath,
  getDashboardViewHref,
  parseDashboardView,
} from '../src/lib/dashboard-view'
import { calculatePoints } from '../src/lib/points'
import { formatAppDateTimeLocal, parseAppDateTimeLocal } from '../src/lib/date-format'
import { buildMatchdayPageViewModel } from '../src/app/(app)/dashboard/matchday-view-model'
import {
  planMatchdayReconciliation,
  validateProviderMatchday,
} from '../src/lib/matchday-sync-validation'

test('calculatePoints covers every scoring tier and Joker multiplier', () => {
  const cases: Array<{
    tip: readonly [number, number]
    result: readonly [number, number]
    expected: number
  }> = [
    { tip: [2, 1], result: [2, 1], expected: 4 },
    { tip: [3, 1], result: [2, 0], expected: 3 },
    { tip: [1, 0], result: [3, 1], expected: 2 },
    { tip: [1, 1], result: [0, 0], expected: 3 },
    { tip: [0, 2], result: [1, 3], expected: 3 },
    { tip: [1, 0], result: [0, 1], expected: 0 },
  ]

  for (const { tip, result, expected } of cases) {
    const [tipHome, tipAway] = tip
    const [actualHome, actualAway] = result
    assert.equal(calculatePoints(tipHome, tipAway, actualHome, actualAway), expected)
    assert.equal(calculatePoints(tipHome, tipAway, actualHome, actualAway, true), expected * 2)
  }
})

test('dashboard view parsing is closed to the supported navigation values', () => {
  assert.equal(parseDashboardView('bundesliga'), 'bundesliga')
  assert.equal(parseDashboardView('statistiken'), 'statistiken')
  assert.equal(parseDashboardView('unknown'), 'spieltag')
  assert.equal(parseDashboardView(null), 'spieltag')
})

test('dashboard links preserve valid historical matchday paths only', () => {
  assert.equal(getDashboardBasePath('/dashboard/34'), '/dashboard/34')
  assert.equal(
    getDashboardViewHref('/dashboard/34', 'bundesliga'),
    '/dashboard/34?ansicht=bundesliga',
  )
  assert.equal(getDashboardViewHref('/profil', 'statistiken'), '/dashboard?ansicht=statistiken')
  assert.equal(getDashboardViewHref('/dashboard/35', 'spieltag'), '/dashboard')
})

test('datetime-local values round-trip in Europe/Berlin and reject the DST gap', () => {
  const winter = parseAppDateTimeLocal('2026-01-15T14:30')
  const summer = parseAppDateTimeLocal('2026-07-15T14:30')

  assert.equal(winter?.toISOString(), '2026-01-15T13:30:00.000Z')
  assert.equal(summer?.toISOString(), '2026-07-15T12:30:00.000Z')
  assert.equal(formatAppDateTimeLocal(new Date('2026-07-15T12:30:00.000Z')), '2026-07-15T14:30')
  assert.equal(parseAppDateTimeLocal('2026-03-29T02:30'), null)
})

test('matchday model exposes an opposing field trend without inventing a rank', () => {
  const users = ['Anna', 'Berta', 'Carla', 'Dora', 'Erik'].map((nickname, index) => ({
    id: `user-${index + 1}`,
    nickname,
    favoriteTeam: null,
    color: null,
  }))
  const tips = Object.fromEntries(users.map((user, index) => [
    user.id,
    {
      homeScore: index < 2 ? 1 : 2,
      awayScore: 0,
      points: null,
      isJoker: false,
    },
  ]))

  const model = buildMatchdayPageViewModel({
    matchday: {
      id: 'matchday-34',
      matchdayNumber: 34,
      status: 'ACTIVE',
      tippDeadline: new Date('2026-05-16T12:00:00.000Z'),
      season: { year: '2025' },
      matches: [{
        id: 'match-1',
        homeTeam: 'Heimteam',
        awayTeam: 'Auswärtsteam',
        homeScore: null,
        awayScore: null,
        matchDate: new Date('2026-05-17T12:00:00.000Z'),
        status: 'SCHEDULED',
      }],
    },
    users,
    tipIndex: { 'match-1': tips },
    matchdayPointsMap: {},
    seasonPointsMap: {},
    currentUserId: 'user-1',
    matchdayList: [{ matchdayNumber: 34 }],
    now: new Date('2026-05-16T12:00:00.001Z'),
  })

  assert.equal(model.matches[0].comparisonType, 'GEGEN_TREND')
  assert.equal(model.matches[0].details.commonPrediction, '2:0')
  assert.equal(model.matches[0].kickoffShortLabel, '14:00')
  assert.equal(model.summary.myRank, null)
  assert.equal(model.summary.insight, 'Noch keine Wertung im Spieltag')
})

test('matchday sync validation rejects partial and unsafe reconciliation plans', () => {
  assert.throws(
    () => validateProviderMatchday([1, 2], ['A', 'B', 'C', 'D']),
    /keinen vollständigen Spieltag/,
  )

  const completeIds = Array.from({ length: 9 }, (_, index) => index + 1)
  const completeTeams = Array.from({ length: 18 }, (_, index) => `Team ${index + 1}`)
  assert.doesNotThrow(() => validateProviderMatchday(completeIds, completeTeams))
  assert.throws(
    () => validateProviderMatchday([...completeIds.slice(0, 8), 8], completeTeams),
    /keinen vollständigen Spieltag/,
  )
  assert.throws(
    () => validateProviderMatchday(completeIds, [...completeTeams.slice(0, 17), 'Team 17']),
    /keinen vollständigen Spieltag/,
  )

  assert.throws(
    () => planMatchdayReconciliation({
      providerMatchIds: completeIds,
      foreignProviderMatchCount: 1,
      existingTargetMatches: [],
    }),
    /anderen Spieltag/,
  )
  assert.throws(
    () => planMatchdayReconciliation({
      providerMatchIds: completeIds,
      foreignProviderMatchCount: 0,
      existingTargetMatches: [{ id: 'stale', openligaMatchId: 99, tipCount: 1 }],
    }),
    /abweichende Spiele mit Tipps/,
  )
  assert.deepEqual(
    planMatchdayReconciliation({
      providerMatchIds: completeIds,
      foreignProviderMatchCount: 0,
      existingTargetMatches: [
        { id: 'kept', openligaMatchId: 1, tipCount: 3 },
        { id: 'stale', openligaMatchId: 99, tipCount: 0 },
      ],
    }),
    ['stale'],
  )
})
