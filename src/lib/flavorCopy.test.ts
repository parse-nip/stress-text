/**
 * Flavor-copy smoke checks — thresholds should react to magnitude.
 * Run: npx tsx src/lib/flavorCopy.test.ts
 */
import { buildDemoExport } from './demoExport'
import { parseExport, detectParticipants } from './parseTelegram'
import { computeWrappedStats, finalizeBadges } from './computeStats'
import {
  comebackCopy,
  introCopy,
  nightOwlCopy,
  streakCopy,
  volumeCopy,
} from './flavorCopy'
import type { WrappedStats } from '../types/telegram'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

const { exportMeta, messages } = parseExport(buildDemoExport())
const people = detectParticipants(messages)
const youId = people.find((p) => p.name === 'Alex')?.id ?? people[0].id
const base = finalizeBadges(computeWrappedStats(messages, youId, exportMeta.name, 2025))

// Volume: blow out your lead → "Wow, you had a lot to say"
const blowout: WrappedStats = {
  ...base,
  you: { ...base.you, messageCount: 900 },
  them: { ...base.them, messageCount: 100 },
  totalMessages: 1000,
}
assert(volumeCopy(blowout).includes('lot to say'), `blowout volume: ${volumeCopy(blowout)}`)

// Volume: nearly tied
const tied: WrappedStats = {
  ...base,
  you: { ...base.you, messageCount: 500 },
  them: { ...base.them, messageCount: 490 },
  totalMessages: 990,
}
assert(volumeCopy(tied).toLowerCase().includes('neck'), `tied volume: ${volumeCopy(tied)}`)

// Intro scales with total
assert(introCopy({ ...base, totalMessages: 50 }).includes('Short chat'), 'small intro')
assert(introCopy({ ...base, totalMessages: 12_000 }).includes('Absolute unit'), 'huge intro')

// Streak tiers
assert(streakCopy({ ...base, longestDailyStreak: 1 }).includes('day one'), 'tiny streak')
assert(streakCopy({ ...base, longestDailyStreak: 120 }).includes('lifestyle'), 'huge streak')

// Night owl early-bird branch
assert(nightOwlCopy({ ...base, you: { ...base.you, lateNightPct: 0.5 } }).includes('Early bird'), 'early bird')

// Comeback long silence
assert(
  comebackCopy({ ...base, comebackGapMs: 40 * 86_400_000 }).includes('Hibernation'),
  'long comeback',
)

console.log('✓ flavorCopy tests passed')
console.log(
  JSON.stringify(
    {
      volumeBlowout: volumeCopy(blowout),
      volumeTied: volumeCopy(tied),
      introDemo: introCopy(base),
      streakDemo: streakCopy(base),
    },
    null,
    2,
  ),
)
