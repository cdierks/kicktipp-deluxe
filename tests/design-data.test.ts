import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMatchdayPageViewModel } from '../src/app/(app)/dashboard/matchday-view-model'
import { layoutEndLabels } from '../src/lib/chart-labels'
import { userColorDistance, userTone } from '../src/lib/user-tone'

test('submission counts reveal no opponent predictions before the deadline for small and larger groups', () => {
  for (const playerCount of [2, 8]) {
    const users = Array.from({ length: playerCount }, (_, index) => ({
      id: `player-${index}`,
      nickname: `Spieler ${index + 1}`,
      favoriteTeam: null,
      color: null,
    }))
    const model = buildMatchdayPageViewModel({
      matchday: {
        id: 'matchday',
        matchdayNumber: 1,
        status: 'ACTIVE',
        tippDeadline: new Date('2026-11-24T12:00:00Z'),
        season: { year: '2026' },
        matches: [{
          id: 'match', homeTeam: 'Heim', awayTeam: 'Gast',
          homeScore: null, awayScore: null,
          matchDate: new Date('2026-11-25T12:00:00Z'), status: 'SCHEDULED',
        }],
      },
      users,
      tipIndex: { match: {
        'player-0': { homeScore: 2, awayScore: 1, points: null, isJoker: false },
      } },
      submissionCounts: { match: playerCount - 1 },
      matchdayPointsMap: {}, seasonPointsMap: {},
      currentUserId: 'player-0', matchdayList: [{ matchdayNumber: 1 }],
      now: new Date('2026-11-23T12:00:00Z'),
    })

    assert.equal(model.ranking.length, playerCount)
    assert.equal(model.matches[0].details.submissionCount, playerCount - 1)
    assert.equal(model.matches[0].details.revealComparison, false)
    assert.deepEqual(model.matches[0].details.participantPredictions.map(row => row.userId), ['player-0'])
    assert.equal(model.matches[0].details.commonPrediction, null)
  }
})

test('end labels stay separated for 2, 8 and 12 players', () => {
  for (const playerCount of [2, 8, 12]) {
    const height = Math.max(240, playerCount * 22 + 20)
    const labels = layoutEndLabels(Array.from({ length: playerCount }, (_, index) => ({ id: index, value: 50 - index })), height)
    assert.equal(labels.length, playerCount)
    assert.ok(labels.every(label => label.top >= 0 && label.top <= height - 22))
    assert.ok(labels.every((label, index) => index === 0 || label.top - labels[index - 1].top >= 22))
  }
})

test('stored palette colors are toned for each surface without changing their hue', () => {
  assert.match(userTone('#F57E59', 'light'), /^#[0-9a-f]{6}$/i)
  assert.match(userTone('#F57E59', 'dark'), /^#[0-9a-f]{6}$/i)
  assert.equal(userColorDistance('#F57E59', '#F57E59'), 0)
  assert.ok(userColorDistance('#F57E59', '#F47D58') < 15)
})
