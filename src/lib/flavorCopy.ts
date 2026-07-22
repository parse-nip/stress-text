/**
 * Value-dependent story copy — cheeky, never mean.
 * After the user picks themselves, their username is always rendered as "You".
 */

import type { WrappedStats } from '../types/telegram'
import {
  formatDuration,
  formatHour,
  formatLongDate,
  formatNumber,
  formatPct,
  formatVoice,
  who,
  whose,
} from './format'

const HOUR = 3_600_000
const DAY = 86_400_000

function ratio(a: number, b: number): number {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (hi === 0) return 1
  return lo === 0 ? Infinity : hi / lo
}

function label(stats: WrappedStats, name: string | null | undefined): string {
  return who(stats.you.name, name)
}

function owned(stats: WrappedStats, name: string | null | undefined): string {
  return whose(stats.you.name, name)
}

export function introCopy(stats: WrappedStats): string {
  const n = stats.totalMessages
  const chat = stats.chatName
  const yearBit = stats.year ? ` · ${stats.year}` : ''
  if (n >= 10_000) return `Your year in ${chat}${yearBit}. Absolute unit of a chat.`
  if (n >= 2_000) return `Your year in ${chat}${yearBit}. Wow — you two never shut up.`
  if (n >= 500) return `Your year in ${chat}${yearBit}. A healthy stack of paper planes.`
  if (n >= 100) return `Your year in ${chat}${yearBit}. Buckle up.`
  return `Your year in ${chat}${yearBit}. Short chat, still worth wrapping.`
}

export function anniversaryCopy(stats: WrappedStats): string {
  const since = formatLongDate(stats.dateRange.start)
  const age = stats.chatAgeMs
  if (age < DAY) return `You've been chatting since ${since}. Brand new altitude.`
  if (age < 30 * DAY) return `You've been chatting since ${since}. Still in the honeymoon ping phase.`
  if (age < 365 * DAY) return `You've been chatting since ${since}. ${formatDuration(age)} of paper planes.`
  return `You've been chatting since ${since}. A multi-year saga.`
}

export function monthlyCopy(stats: WrappedStats): string {
  const months = stats.monthHistogram
  if (months.length === 0) return 'Not enough timeline to sketch a sparkline.'
  const peak = months.reduce((a, b) => (b.count > a.count ? b : a), months[0])
  if (months.length < 3) return `Peak month: ${peak.label} (${formatNumber(peak.count)} messages).`
  const quiet = months.reduce((a, b) => (b.count < a.count ? b : a), months[0])
  if (peak.count >= quiet.count * 3 && quiet.count > 0) {
    return `${peak.label} was the hot streak (${formatNumber(peak.count)}). ${quiet.label} took a nap.`
  }
  return `Messages over time — peak in ${peak.label} with ${formatNumber(peak.count)}.`
}

export function yearCompareCopy(stats: WrappedStats): string {
  const yc = stats.yearCompare
  if (!yc) return 'One-year wonder — nothing to compare yet.'
  const { recentYear, priorYear, recentCount, priorCount } = yc
  if (recentCount === priorCount) {
    return `${recentYear} vs ${priorYear}: dead heat at ${formatNumber(recentCount)} each.`
  }
  if (recentCount > priorCount) {
    const pct = Math.round(((recentCount - priorCount) / Math.max(priorCount, 1)) * 100)
    return `${recentYear} out-chatted ${priorYear} by ${formatNumber(recentCount - priorCount)} messages (+${pct}%).`
  }
  const pct = Math.round(((priorCount - recentCount) / Math.max(recentCount, 1)) * 100)
  return `${priorYear} was louder — ${formatNumber(priorCount - recentCount)} more messages than ${recentYear} (${pct}% up).`
}

export function volumeCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const youLead = you.messageCount >= them.messageCount
  const leadN = youLead ? you.messageCount : them.messageCount
  const trailN = youLead ? them.messageCount : you.messageCount
  const r = ratio(you.messageCount, them.messageCount)
  const nearlyTied = r < 1.08

  if (nearlyTied) {
    return `Neck and neck — ${formatNumber(you.messageCount)} vs ${formatNumber(them.messageCount)}. Diplomatic vibes.`
  }
  if (youLead) {
    if (r >= 3) return `Wow, you had a lot to say — ${formatNumber(leadN)} to their ${formatNumber(trailN)}.`
    if (r >= 1.6) return `You clearly had a lot to say. Comfortably ahead.`
    return `You edged it. A polite landslide.`
  }
  if (r >= 3) return `${them.name} ran the mic — ${formatNumber(leadN)} messages. You were on receive mode.`
  if (r >= 1.6) return `${them.name} took the mic — respectfully.`
  return `${them.name} squeaked ahead. Rematch anytime.`
}

export function replySpeedCopy(stats: WrappedStats): string {
  const { you, them } = stats
  if (you.avgReplyMs == null && them.avgReplyMs == null) {
    return 'Not enough back-and-forth to crown a speed demon yet.'
  }
  if (you.avgReplyMs == null) {
    return `${them.name} has the only measurable reply time. Mystery speedster: you.`
  }
  if (them.avgReplyMs == null) {
    return 'You have the only measurable reply time. Instant legend energy.'
  }

  const youFaster = you.avgReplyMs <= them.avgReplyMs
  const fast = youFaster ? you.avgReplyMs : them.avgReplyMs
  const slow = youFaster ? them.avgReplyMs : you.avgReplyMs
  const gap = slow - fast

  if (youFaster) {
    if (fast < 60_000) return 'Lightning thumbs. Your paper plane left the hangar first.'
    if (gap > 6 * HOUR) return `You usually land first — and by a lot (${formatDuration(gap)} faster on average).`
    return 'Your paper plane left the hangar first. Fastest replier badge unlocked.'
  }
  if (them.avgReplyMs < 60_000) {
    return `${them.name} replies in a blink. Speed isn't everything… usually.`
  }
  if (gap > 6 * HOUR) {
    return `${them.name} usually lands first — patiently waiting is a skill too.`
  }
  return `${them.name} usually landed first. Speed isn't everything… usually.`
}

export function leftOnReadCopy(stats: WrappedStats): string {
  const ms = stats.longestLeftOnReadMs
  const by = label(stats, stats.longestLeftOnReadBy)
  if (ms <= 0) return 'No legendary pauses. A chat that never left anyone hanging.'
  if (ms < HOUR) {
    return by
      ? `Longest wait before ${by} replied — barely a pause. Efficient friendship.`
      : 'Barely a pause. Efficient friendship.'
  }
  if (ms < DAY) {
    return by
      ? `Longest wait before ${by} replied. Worth the suspense.`
      : 'A legendary pause in the timeline.'
  }
  if (ms < 7 * DAY) {
    return by
      ? `${formatDuration(ms)} before ${by} came back. Cliffhanger arc unlocked.`
      : `${formatDuration(ms)} of silence. Cliffhanger arc unlocked.`
  }
  return by
    ? `${formatDuration(ms)} before ${by} replied. Archaeology, not texting.`
    : `${formatDuration(ms)} of silence. Archaeology, not texting.`
}

export function nightOwlCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const pct = you.lateNightPct
  const badge = label(stats, stats.badges.nightOwl)
  const themBit = ` ${them.name}: ${formatPct(them.lateNightPct)}.`

  if (pct < 2) {
    return `Almost none of your messages flew between 12am–4am.${themBit} Badge: ${badge}. Early bird coded.`
  }
  if (pct < 10) {
    return `A few of your messages slipped past midnight.${themBit} Badge: ${badge}.`
  }
  if (pct < 25) {
    return `${formatPct(pct)} of your messages flew between 12am–4am.${themBit} Badge: ${badge}.`
  }
  return `${formatPct(pct)} after midnight — full night-owl mode.${themBit} Badge: ${badge}.`
}

export function streakCopy(stats: WrappedStats): string {
  const n = stats.longestDailyStreak
  if (n <= 1) return 'No multi-day streak yet. Every legend starts with day one.'
  if (n < 7) return `${n} days without missing a beat. Warming up.`
  if (n < 30) return `Without missing a single day. Streak Master energy.`
  if (n < 100) return `${n} days straight. This chat had a calendar habit.`
  return `${n} days. At this point it's a lifestyle.`
}

export function primeTimeCopy(stats: WrappedStats): string {
  const h = stats.primeHour
  const day = stats.primeDayName
  if (h >= 0 && h < 5) return `${day} around ${formatHour(h)} — peak chaos o'clock.`
  if (h >= 5 && h < 9) return `${day} mornings. Coffee-powered altitude.`
  if (h >= 9 && h < 12) return `${day} late mornings. Productive chatter window.`
  if (h >= 12 && h < 17) return `${day} afternoons — that's when this chat hits peak altitude.`
  if (h >= 17 && h < 21) return `${day} evenings. Prime hangout hours.`
  return `${day} nights. Peak altitude after dark.`
}

export function openerCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const youLead = you.daysStarted >= them.daysStarted
  const r = ratio(you.daysStarted, them.daysStarted)
  const name = label(stats, stats.badges.mostReliableOpener)

  if (you.daysStarted + them.daysStarted === 0) {
    return 'No clear openers yet — the chat just… appeared.'
  }
  if (r < 1.15) {
    return `Toss-up openers. ${name} barely wears the crown.`
  }
  if (youLead) {
    if (r >= 2.5) return `You start the day — a lot. Alarm-clock energy.`
    return `Most reliable opener: you. First message of the day, on repeat.`
  }
  if (r >= 2.5) return `${them.name} wakes the chat up. Consistently.`
  return `${owned(stats, them.name)} the first hello most days.`
}

export function doubleTextCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const king = you.maxConsecutiveWithoutReply >= them.maxConsecutiveWithoutReply ? you : them
  const n = king.maxConsecutiveWithoutReply
  const times = king.timesDoubleTexted
  const whoLabel = label(stats, king.name)
  const ownedLabel = owned(stats, king.name)

  if (n <= 1) return 'No double-text streaks. Extreme chill. Rare.'
  if (n === 2) {
    return times > 0
      ? `${ownedLabel} classic double-text. Happened ${formatNumber(times)} times.`
      : `${ownedLabel} classic double-text streak.`
  }
  if (n <= 4) {
    return times > 0
      ? `${ownedLabel} longest no-reply streak: ${n}. Double+ texted ${formatNumber(times)} times. Commitment.`
      : `${ownedLabel} longest no-reply streak: ${n}. Commitment.`
  }
  return times > 0
    ? `${n} in a row from ${whoLabel}. Novel energy. Double+ ${formatNumber(times)} times.`
    : `${n} in a row from ${whoLabel}. Novel energy.`
}

export function oneSidedCopy(stats: WrappedStats): string {
  const d = stats.mostOneSidedDay
  if (!d || d.imbalance === 0) return 'Surprisingly balanced. Weirdly wholesome.'

  const { you, them } = stats
  const leaderRaw =
    d.leaderId === you.id ? you.name : d.leaderId === them.id ? them.name : 'someone'
  const leader = label(stats, leaderRaw)
  const gap = d.imbalance

  if (gap < 5) return `Message gap on ${d.dateKey}. Barely tilted — ${leader} nudged ahead.`
  if (gap < 20) return `Message gap on ${d.dateKey}. ${leader} carried the chat that day.`
  return `Message gap on ${d.dateKey}. ${leader} absolutely carried — ${formatNumber(gap)} more messages.`
}

export function voiceCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const total = you.voiceCount + them.voiceCount
  const longest = Math.max(you.longestVoiceSec, them.longestVoiceSec)
  const king = you.voiceCount >= them.voiceCount ? you : them
  const kingLabel = label(stats, king.name)

  if (total === 0) return 'Zero voice notes. Typed loyalty. Respect.'
  if (total <= 3) {
    return `A rare voice sighting. Longest: ${formatVoice(longest)}.`
  }
  if (longest >= 120) {
    return `Longest: ${formatVoice(longest)} — a podcast episode. ${kingLabel} sent the most (${formatNumber(king.voiceCount)}).`
  }
  return `Longest: ${formatVoice(longest)}. ${kingLabel} sent the most (${formatNumber(king.voiceCount)}).`
}

export function mediaCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const total = you.mediaCount + them.mediaCount
  const king = you.mediaCount >= them.mediaCount ? you : them
  const kingLabel = label(stats, king.name)
  const photos = you.photoCount + them.photoCount
  const videos = you.videoCount + them.videoCount

  if (total === 0) return 'No photos or videos in this slice. Pure text era.'
  if (total <= 5) return `${kingLabel} shared the most media — a tasteful handful.`
  if (videos > photos && videos > 0) {
    return `${kingLabel} shared the most media. Video-forward friendship.`
  }
  if (photos >= 50) {
    return `${kingLabel} flooded the album — ${formatNumber(king.mediaCount)} media drops.`
  }
  return `${kingLabel} shared the most media.`
}

export function essayCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const longest = you.longestMessageWords >= them.longestMessageWords ? you : them
  const words = longest.longestMessageWords
  const badge = label(stats, stats.badges.essayWriter)
  const ownedLabel = owned(stats, longest.name)
  const whoLabel = label(stats, longest.name)

  if (words < 20) return `Short and sweet maxes. Badge: ${badge}.`
  if (words < 80) return `${ownedLabel} solid paragraph. Badge: ${badge}.`
  if (words < 200) return `${ownedLabel} magnum opus. Badge: ${badge}.`
  return `${words} words from ${whoLabel}. That's a scroll. Badge: ${badge}.`
}

export function chaosCopy(stats: WrappedStats): string {
  const { you, them } = stats
  const bangs = Math.max(you.exclamationCount, them.exclamationCount)
  const caps = Math.max(you.allCapsCount, them.allCapsCount)
  const edits = Math.max(you.editedCount, them.editedCount)
  const spice = bangs + caps * 2 + edits

  if (spice === 0) return 'No bangs, no caps, no edits. Zen punctuation monastery.'
  if (spice < 10) return 'A light dusting of chaos. Still mostly vibes.'
  if (caps >= 10 && caps >= bangs) return 'ALL CAPS era detected. Enthusiasm undocumented.'
  if (edits >= 15) return 'Heavy edit energy. Draft → send → oops → edit.'
  if (bangs >= 30) return 'Exclamation rain. Enthusiasm undocumented, clearly present.'
  return 'Just vibes and punctuation metadata.'
}

export function lexCopy(stats: WrappedStats): string {
  const phrase = stats.topPhrase
  const word = stats.topWord
  const pick = phrase && phrase.count >= (word?.count ?? 0) ? phrase : word
  if (!pick) return 'No standout words after filtering the filler. Mysterious.'

  const leader = label(stats, pick.leader)
  const crown = leader ? ` ${leader} said it most.` : ''
  if (pick.kind === 'phrase') {
    if (pick.count >= 20) return `"${pick.value}" on loop.${crown} Official catchphrase.`
    return `"${pick.value}" showed up ${formatNumber(pick.count)} times.${crown}`
  }
  if (pick.count >= 40) return `"${pick.value}" is the house word.${crown}`
  return `"${pick.value}" — used ${formatNumber(pick.count)} times.${crown}`
}

export function emojiCopy(stats: WrappedStats): string {
  if (!stats.topEmoji) return 'A surprisingly emoji-free zone. Minimalist icons.'
  const n = stats.topEmojiCount
  const leader = label(stats, stats.topEmojiLeader)
  const crown = leader ? ` ${leader} wore the crown.` : ''

  if (n < 5) return `Used ${formatNumber(n)} times.${crown} A subtle signature.`
  if (n < 25) return `Used ${formatNumber(n)} times.${crown}`
  if (n < 100) return `Used ${formatNumber(n)} times.${crown} Official chat mascot.`
  return `Used ${formatNumber(n)} times.${crown} At this point it's a personality.`
}

export function comebackCopy(stats: WrappedStats): string {
  const ms = stats.comebackGapMs
  if (ms <= 0) return 'No long silences. Continuity mode: on.'
  if (ms < DAY) return 'Biggest gap before the chat picked back up — short-lived quiet.'
  if (ms < 7 * DAY) {
    return `Biggest gap: ${formatDuration(ms)}. Absence makes the paper plane fly farther.`
  }
  if (ms < 30 * DAY) {
    return `${formatDuration(ms)} of radio silence, then a comeback. Plot twist season.`
  }
  return `${formatDuration(ms)} away. Hibernation, then lift-off.`
}

export function badgesHeadline(stats: WrappedStats): string {
  const yours =
    [
      stats.badges.fastestReplier === stats.you.name,
      stats.badges.nightOwl === stats.you.name,
      stats.badges.essayWriter === stats.you.name,
      stats.badges.streakMaster === stats.you.name,
      stats.badges.mostReliableOpener === stats.you.name,
    ].filter(Boolean).length

  if (yours >= 4) return 'Your trophy shelf'
  if (yours <= 1) return 'Shared glory'
  return 'Your badges'
}
