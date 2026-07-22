import type {
  DayActivity,
  MonthBucket,
  ParsedMessage,
  PersonStats,
  WrappedStats,
  YearCompare,
} from '../types/telegram'
import { detectParticipants } from './parseTelegram'
import { computeTopLexemes } from './topWords'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildMonthHistogram(messages: ParsedMessage[]): MonthBucket[] {
  if (messages.length === 0) return []
  const counts = new Map<string, number>()
  for (const m of messages) {
    const k = monthKey(m.date)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const start = messages[0].date
  const end = messages[messages.length - 1].date
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  const multiYear = start.getFullYear() !== end.getFullYear()
  const out: MonthBucket[] = []

  while (cursor <= last) {
    const key = monthKey(cursor)
    const label = multiYear
      ? `${MONTH_SHORT[cursor.getMonth()]} '${String(cursor.getFullYear()).slice(2)}`
      : MONTH_SHORT[cursor.getMonth()]
    out.push({ key, label, count: counts.get(key) ?? 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
}

function buildYearCompare(messages: ParsedMessage[], yearFilter: number | null): YearCompare | null {
  if (yearFilter != null) return null
  const byYear = new Map<number, number>()
  for (const m of messages) {
    const y = m.date.getFullYear()
    byYear.set(y, (byYear.get(y) ?? 0) + 1)
  }
  const years = [...byYear.keys()].sort((a, b) => b - a)
  if (years.length < 2) return null
  const recentYear = years[0]
  const priorYear = years[1]
  return {
    recentYear,
    priorYear,
    recentCount: byYear.get(recentYear) ?? 0,
    priorCount: byYear.get(priorYear) ?? 0,
  }
}

function emptyPerson(id: string, name: string): PersonStats {
  return {
    id,
    name,
    messageCount: 0,
    wordCount: 0,
    avgWordsPerMessage: 0,
    avgReplyMs: null,
    replyCount: 0,
    lateNightPct: 0,
    lateNightCount: 0,
    voiceCount: 0,
    longestVoiceSec: 0,
    mediaCount: 0,
    photoCount: 0,
    videoCount: 0,
    exclamationCount: 0,
    allCapsCount: 0,
    editedCount: 0,
    daysStarted: 0,
    longestMessageWords: 0,
    longestMessageChars: 0,
    longestMessagePreview: '',
    avgMessageChars: 0,
    emojiCounts: {},
    maxConsecutiveWithoutReply: 0,
    timesDoubleTexted: 0,
  }
}

function isLateNight(d: Date): boolean {
  const h = d.getHours()
  return h >= 0 && h < 4
}

/**
 * Reply = first message from B after one or more messages from A,
 * measured from the last message of A's streak.
 */
function computeReplyStats(
  messages: ParsedMessage[],
  personIds: Set<string>,
): Map<string, { totalMs: number; count: number; longestGapMs: number; longestGapAt: Date | null; longestBy: string }> {
  const replyAcc = new Map<string, { totalMs: number; count: number }>()
  for (const id of personIds) replyAcc.set(id, { totalMs: 0, count: 0 })

  let longestGapMs = 0
  let longestGapAt: Date | null = null
  let longestBy = ''

  let i = 0
  while (i < messages.length) {
    const streakFrom = messages[i].fromId
    let j = i + 1
    while (j < messages.length && messages[j].fromId === streakFrom) j++
    if (j >= messages.length) break

    const lastOfStreak = messages[j - 1]
    const reply = messages[j]
    if (reply.fromId !== streakFrom && personIds.has(reply.fromId)) {
      const gap = reply.date.getTime() - lastOfStreak.date.getTime()
      if (gap >= 0) {
        const acc = replyAcc.get(reply.fromId)!
        acc.totalMs += gap
        acc.count += 1
        if (gap > longestGapMs) {
          longestGapMs = gap
          longestGapAt = reply.date
          longestBy = reply.from
        }
      }
    }
    i = j
  }

  const out = new Map<
    string,
    { totalMs: number; count: number; longestGapMs: number; longestGapAt: Date | null; longestBy: string }
  >()
  for (const [id, acc] of replyAcc) {
    out.set(id, { ...acc, longestGapMs, longestGapAt, longestBy })
  }
  return out
}

function computeConsecutiveStreaks(messages: ParsedMessage[]): Map<string, { max: number; doublePlusTimes: number }> {
  const result = new Map<string, { max: number; doublePlusTimes: number }>()
  let i = 0
  while (i < messages.length) {
    const fromId = messages[i].fromId
    let j = i + 1
    while (j < messages.length && messages[j].fromId === fromId) j++
    const len = j - i
    const cur = result.get(fromId) ?? { max: 0, doublePlusTimes: 0 }
    cur.max = Math.max(cur.max, len)
    if (len >= 2) cur.doublePlusTimes += 1
    result.set(fromId, cur)
    i = j
  }
  return result
}

function computeDailyStreak(messages: ParsedMessage[]): { longest: number; endedOn: string | null } {
  const days = [...new Set(messages.map((m) => dateKey(m.date)))].sort()
  if (days.length === 0) return { longest: 0, endedOn: null }

  let longest = 1
  let current = 1
  let endedOn = days[0]

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] + 'T12:00:00')
    const cur = new Date(days[i] + 'T12:00:00')
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      current += 1
      if (current > longest) {
        longest = current
        endedOn = days[i]
      }
    } else {
      current = 1
    }
  }
  return { longest, endedOn }
}

function computeComeback(messages: ParsedMessage[]): { gapMs: number; resumedAt: Date | null } {
  if (messages.length < 2) return { gapMs: 0, resumedAt: null }
  let maxGap = 0
  let resumedAt: Date | null = null
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].date.getTime() - messages[i - 1].date.getTime()
    if (gap > maxGap) {
      maxGap = gap
      resumedAt = messages[i].date
    }
  }
  return { gapMs: maxGap, resumedAt }
}

function computeOpeners(messages: ParsedMessage[], personIds: string[]): Map<string, number> {
  const starts = new Map<string, number>()
  for (const id of personIds) starts.set(id, 0)

  const byDay = new Map<string, ParsedMessage[]>()
  for (const m of messages) {
    const key = dateKey(m.date)
    const list = byDay.get(key) ?? []
    list.push(m)
    byDay.set(key, list)
  }

  for (const list of byDay.values()) {
    const first = list[0]
    if (personIds.includes(first.fromId)) {
      starts.set(first.fromId, (starts.get(first.fromId) ?? 0) + 1)
    }
  }
  return starts
}

export function computeWrappedStats(
  messages: ParsedMessage[],
  youId: string,
  chatName: string,
  yearFilter: number | null = null,
): WrappedStats {
  let filtered = messages
  if (yearFilter != null) {
    filtered = messages.filter((m) => m.date.getFullYear() === yearFilter)
  }
  if (filtered.length === 0) {
    throw new Error(yearFilter ? `No messages found for ${yearFilter}.` : 'No messages to analyze.')
  }

  const participants = detectParticipants(filtered)
  // Keep top 2 for 1:1 vibe; still compute for whoever is "you"/"them"
  const topTwo = participants.slice(0, 2)
  if (topTwo.length < 1) throw new Error('Could not identify participants.')

  const youMeta = topTwo.find((p) => p.id === youId) ?? topTwo[0]
  const themMeta = topTwo.find((p) => p.id !== youMeta.id) ?? topTwo[0]
  const personIds = [youMeta.id, themMeta.id]
  const personIdSet = new Set(personIds)

  const peopleMap = new Map<string, PersonStats>()
  peopleMap.set(youMeta.id, emptyPerson(youMeta.id, youMeta.name))
  peopleMap.set(themMeta.id, emptyPerson(themMeta.id, themMeta.name))

  const hourCounts = new Array(24).fill(0)
  const dowCounts = new Array(7).fill(0)
  const dayMap = new Map<string, DayActivity>()

  for (const m of filtered) {
    if (!peopleMap.has(m.fromId)) continue
    const p = peopleMap.get(m.fromId)!
    p.messageCount += 1
    p.wordCount += m.wordCount
    p.exclamationCount += m.exclamationCount
    if (m.isAllCaps) p.allCapsCount += 1
    if (m.isEdited) p.editedCount += 1
    if (isLateNight(m.date)) p.lateNightCount += 1
    if (m.isVoice) {
      p.voiceCount += 1
      p.longestVoiceSec = Math.max(p.longestVoiceSec, m.voiceDurationSec)
    }
    if (m.isPhoto) {
      p.photoCount += 1
      p.mediaCount += 1
    }
    if (m.isVideo) {
      p.videoCount += 1
      p.mediaCount += 1
    }
    if (m.wordCount > p.longestMessageWords || m.charCount > p.longestMessageChars) {
      p.longestMessageWords = Math.max(p.longestMessageWords, m.wordCount)
      p.longestMessageChars = Math.max(p.longestMessageChars, m.charCount)
      p.longestMessagePreview = m.text.slice(0, 80)
    }
    for (const e of m.emojis) {
      p.emojiCounts[e] = (p.emojiCounts[e] ?? 0) + 1
    }

    hourCounts[m.date.getHours()] += 1
    dowCounts[m.date.getDay()] += 1

    const dk = dateKey(m.date)
    let day = dayMap.get(dk)
    if (!day) {
      day = { dateKey: dk, counts: {}, total: 0, imbalance: 0, leaderId: null }
      dayMap.set(dk, day)
    }
    day.counts[m.fromId] = (day.counts[m.fromId] ?? 0) + 1
    day.total += 1
  }

  // Finalize per-person averages + late night %
  for (const p of peopleMap.values()) {
    p.avgWordsPerMessage = p.messageCount ? p.wordCount / p.messageCount : 0
    p.avgMessageChars = p.messageCount
      ? filtered.filter((m) => m.fromId === p.id).reduce((s, m) => s + m.charCount, 0) / p.messageCount
      : 0
    p.lateNightPct = p.messageCount ? (p.lateNightCount / p.messageCount) * 100 : 0
  }

  const replyStats = computeReplyStats(filtered, personIdSet)
  for (const [id, r] of replyStats) {
    const p = peopleMap.get(id)
    if (!p) continue
    p.replyCount = r.count
    p.avgReplyMs = r.count ? r.totalMs / r.count : null
  }

  const streaks = computeConsecutiveStreaks(filtered.filter((m) => personIdSet.has(m.fromId)))
  for (const [id, s] of streaks) {
    const p = peopleMap.get(id)
    if (!p) continue
    p.maxConsecutiveWithoutReply = s.max
    p.timesDoubleTexted = s.doublePlusTimes
  }

  const openers = computeOpeners(
    filtered.filter((m) => personIdSet.has(m.fromId)),
    personIds,
  )
  for (const [id, n] of openers) {
    const p = peopleMap.get(id)
    if (p) p.daysStarted = n
  }

  // Most one-sided day
  let mostOneSided: DayActivity | null = null
  for (const day of dayMap.values()) {
    const a = day.counts[youMeta.id] ?? 0
    const b = day.counts[themMeta.id] ?? 0
    day.imbalance = Math.abs(a - b)
    day.leaderId = a === b ? null : a > b ? youMeta.id : themMeta.id
    if (!mostOneSided || day.imbalance > mostOneSided.imbalance) {
      mostOneSided = day
    }
  }

  const replyMeta = replyStats.get(youMeta.id) ?? replyStats.get(themMeta.id)
  const daily = computeDailyStreak(filtered)
  const comeback = computeComeback(filtered)

  // Top emoji across chat
  const globalEmoji = new Map<string, { count: number; by: Record<string, number> }>()
  for (const p of peopleMap.values()) {
    for (const [e, c] of Object.entries(p.emojiCounts)) {
      const g = globalEmoji.get(e) ?? { count: 0, by: {} }
      g.count += c
      g.by[p.id] = (g.by[p.id] ?? 0) + c
      globalEmoji.set(e, g)
    }
  }
  let topEmoji: string | null = null
  let topEmojiCount = 0
  let topEmojiLeader: string | null = null
  for (const [e, g] of globalEmoji) {
    if (g.count > topEmojiCount) {
      topEmoji = e
      topEmojiCount = g.count
      const leader = Object.entries(g.by).sort((a, b) => b[1] - a[1])[0]
      topEmojiLeader = leader ? peopleMap.get(leader[0])?.name ?? null : null
    }
  }

  const lex = computeTopLexemes(
    filtered.filter((m) => personIdSet.has(m.fromId)),
    personIdSet,
  )

  let primeHour = 0
  let primeDow = 0
  for (let h = 0; h < 24; h++) if (hourCounts[h] > hourCounts[primeHour]) primeHour = h
  for (let d = 0; d < 7; d++) if (dowCounts[d] > dowCounts[primeDow]) primeDow = d

  const you = peopleMap.get(youMeta.id)!
  const them = peopleMap.get(themMeta.id)!

  const faster =
    you.avgReplyMs != null && them.avgReplyMs != null
      ? you.avgReplyMs <= them.avgReplyMs
        ? you.name
        : them.name
      : you.avgReplyMs != null
        ? you.name
        : them.name

  const nightOwl = you.lateNightPct >= them.lateNightPct ? you.name : them.name
  const essayWriter = you.avgWordsPerMessage >= them.avgWordsPerMessage ? you.name : them.name
  const opener = you.daysStarted >= them.daysStarted ? you.name : them.name

  const rangeStart = filtered[0].date
  const rangeEnd = filtered[filtered.length - 1].date

  return {
    chatName,
    year: yearFilter,
    totalMessages: filtered.length,
    dateRange: {
      start: rangeStart,
      end: rangeEnd,
    },
    chatAgeMs: Math.max(0, rangeEnd.getTime() - rangeStart.getTime()),
    you,
    them,
    people: [you, them],
    longestLeftOnReadMs: replyMeta?.longestGapMs ?? 0,
    longestLeftOnReadBy: replyMeta?.longestBy ?? '',
    longestLeftOnReadAt: replyMeta?.longestGapAt ?? null,
    comebackGapMs: comeback.gapMs,
    comebackResumedAt: comeback.resumedAt,
    longestDailyStreak: daily.longest,
    streakEndedOn: daily.endedOn,
    primeHour,
    primeDayOfWeek: primeDow,
    primeDayName: DAY_NAMES[primeDow],
    hourHistogram: hourCounts,
    dowHistogram: dowCounts,
    monthHistogram: buildMonthHistogram(filtered),
    yearCompare: buildYearCompare(filtered, yearFilter),
    mostOneSidedDay: mostOneSided,
    topEmoji,
    topEmojiCount,
    topEmojiLeader,
    topWord: lex.topWord,
    topPhrase: lex.topPhrase,
    badges: {
      fastestReplier: faster,
      nightOwl,
      essayWriter,
      streakMaster: 'both of you', // daily streak is shared; badge goes to higher engager below
      mostReliableOpener: opener,
    },
  }
}

/** Refine streak master: more messages during the streak window isn't tracked finely — use opener+volume. */
export function finalizeBadges(stats: WrappedStats): WrappedStats {
  const streakMaster =
    stats.you.messageCount >= stats.them.messageCount ? stats.you.name : stats.them.name
  return {
    ...stats,
    badges: { ...stats.badges, streakMaster },
  }
}

/** Swap you/them so the other person can get their own shareable summary card. */
export function flipPerspective(stats: WrappedStats): WrappedStats {
  const swapName = (name: string | null): string | null => {
    if (name == null) return null
    if (name === stats.you.name) return stats.them.name
    if (name === stats.them.name) return stats.you.name
    return name
  }

  const flippedOneSided = stats.mostOneSidedDay
    ? {
        ...stats.mostOneSidedDay,
        leaderId:
          stats.mostOneSidedDay.leaderId === stats.you.id
            ? stats.them.id
            : stats.mostOneSidedDay.leaderId === stats.them.id
              ? stats.you.id
              : stats.mostOneSidedDay.leaderId,
      }
    : null

  return {
    ...stats,
    you: stats.them,
    them: stats.you,
    people: [stats.them, stats.you],
    longestLeftOnReadBy: swapName(stats.longestLeftOnReadBy) ?? '',
    topEmojiLeader: swapName(stats.topEmojiLeader),
    topWord: stats.topWord
      ? { ...stats.topWord, leader: swapName(stats.topWord.leader) }
      : null,
    topPhrase: stats.topPhrase
      ? { ...stats.topPhrase, leader: swapName(stats.topPhrase.leader) }
      : null,
    mostOneSidedDay: flippedOneSided,
    badges: {
      fastestReplier: swapName(stats.badges.fastestReplier) ?? stats.badges.fastestReplier,
      nightOwl: swapName(stats.badges.nightOwl) ?? stats.badges.nightOwl,
      essayWriter: swapName(stats.badges.essayWriter) ?? stats.badges.essayWriter,
      streakMaster: swapName(stats.badges.streakMaster) ?? stats.badges.streakMaster,
      mostReliableOpener:
        swapName(stats.badges.mostReliableOpener) ?? stats.badges.mostReliableOpener,
    },
  }
}
