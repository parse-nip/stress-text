/**
 * Tiny Node test runner for the stats engine (no Vitest required).
 * Run: npx tsx src/lib/computeStats.test.ts
 */
import { buildDemoExport } from './demoExport'
import { parseExport, detectParticipants } from './parseTelegram'
import { computeWrappedStats, finalizeBadges } from './computeStats'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const { exportMeta, messages } = parseExport(buildDemoExport())
const people = detectParticipants(messages)
assert(people.length >= 2, 'expected 2+ participants')
assert(messages.length > 50, 'demo should have a meaty message count')

const youId = people.find((p) => p.name === 'Alex')?.id ?? people[0].id
const stats = finalizeBadges(computeWrappedStats(messages, youId, exportMeta.name, 2025))

assert(stats.totalMessages > 0, 'total messages')
assert(stats.you.name === 'Alex', `you should be Alex, got ${stats.you.name}`)
assert(stats.them.name === 'Sam', `them should be Sam, got ${stats.them.name}`)
assert(stats.longestDailyStreak >= 2, 'daily streak should exist')
assert(stats.comebackGapMs > 5 * 86_400_000, 'comeback gap should reflect the 10-day silence')
assert(stats.you.lateNightPct > 0, 'Alex should have late-night messages')
assert(stats.you.maxConsecutiveWithoutReply >= 3, 'double/triple text streak')
assert(stats.topEmoji != null, 'should find a top emoji')
assert(stats.you.avgReplyMs != null || stats.them.avgReplyMs != null, 'reply times')
assert(stats.badges.fastestReplier.length > 0, 'fastest badge')
assert(stats.you.editedCount > 0, 'edited messages in demo')
assert(stats.you.voiceCount + stats.them.voiceCount > 0, 'voice messages')
assert((stats.you.mediaCount + stats.them.mediaCount) > 0, 'media shared')

console.log('✓ computeStats tests passed')
console.log(
  JSON.stringify(
    {
      total: stats.totalMessages,
      streak: stats.longestDailyStreak,
      nightYou: Math.round(stats.you.lateNightPct),
      topEmoji: stats.topEmoji,
      badges: stats.badges,
      comebackDays: Math.round(stats.comebackGapMs / 86_400_000),
    },
    null,
    2,
  ),
)
