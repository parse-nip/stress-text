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
const allTime = finalizeBadges(computeWrappedStats(messages, youId, exportMeta.name, null))

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
assert(stats.you.avgEditDelayMs != null && stats.you.avgEditDelayMs > 0, 'edit delay measurable')
assert(stats.you.editPct > 0, 'edit pct')
assert(stats.you.voiceCount + stats.them.voiceCount > 0, 'voice messages')
assert((stats.you.mediaCount + stats.them.mediaCount) > 0, 'media shared')
assert(stats.hourHistogram.length === 24, 'hour histogram length')
assert(stats.dowHistogram.length === 7, 'dow histogram length')
assert(stats.hourHistogram.reduce((a, b) => a + b, 0) === stats.totalMessages, 'hour hist sums to total')
assert(stats.dowHistogram.reduce((a, b) => a + b, 0) === stats.totalMessages, 'dow hist sums to total')
assert(stats.hourHistogram[stats.primeHour] === Math.max(...stats.hourHistogram), 'prime hour is max')
assert(stats.monthHistogram.length >= 2, 'month histogram should span months')
assert(stats.chatAgeMs > 0, 'chat age')
assert(allTime.yearCompare != null, 'all-time demo should span two years')
assert(allTime.yearCompare!.recentYear === 2025, 'recent year')
assert(allTime.yearCompare!.priorYear === 2024, 'prior year')
assert(allTime.monthHistogram.length >= 3, 'all-time months span 2024→2025')
assert(allTime.topWord != null || allTime.topPhrase != null, 'expected a top word or phrase')
assert(allTime.topPhrase?.value.includes('coffee') || allTime.topWord?.value === 'coffee', 'coffee catchphrase')
assert(stats.laughHistogram.length === 24, 'laugh histogram')
assert(stats.funniestHourLaughs > 0, 'demo should have laughs')
assert(stats.funniestHour >= 0, 'funniest hour set')

console.log('✓ computeStats tests passed')
console.log(
  JSON.stringify(
    {
      total: stats.totalMessages,
      streak: stats.longestDailyStreak,
      nightYou: Math.round(stats.you.lateNightPct),
      topEmoji: stats.topEmoji,
      topWord: allTime.topWord,
      topPhrase: allTime.topPhrase,
      yearCompare: allTime.yearCompare,
      months: allTime.monthHistogram.length,
      badges: stats.badges,
      comebackDays: Math.round(stats.comebackGapMs / 86_400_000),
      primeHour: stats.primeHour,
      primeDay: stats.primeDayName,
    },
    null,
    2,
  ),
)
