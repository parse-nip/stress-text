/** Raw Telegram Desktop JSON export shapes (content-blind — we never interpret meaning). */

export type TelegramTextEntity =
  | string
  | {
      type: string
      text: string
      href?: string
      document_id?: string
    }

export interface TelegramRawMessage {
  id: number
  type: string
  date: string
  date_unixtime?: string
  from?: string
  from_id?: string
  actor?: string
  actor_id?: string
  text?: TelegramTextEntity | TelegramTextEntity[]
  text_entities?: Array<{ type: string; text: string }>
  photo?: string
  file?: string
  thumbnail?: string
  media_type?: string
  mime_type?: string
  duration_seconds?: number
  width?: number
  height?: number
  sticker_emoji?: string
  edited?: string
  edited_unixtime?: string
  forwarded_from?: string
  reply_to_message_id?: number
}

export interface TelegramExport {
  name: string
  type: string
  id: number
  messages: TelegramRawMessage[]
}

export interface ParsedMessage {
  id: number
  date: Date
  from: string
  fromId: string
  text: string
  wordCount: number
  charCount: number
  isVoice: boolean
  voiceDurationSec: number
  isPhoto: boolean
  isVideo: boolean
  isSticker: boolean
  stickerEmoji: string | null
  isEdited: boolean
  exclamationCount: number
  isAllCaps: boolean
  emojis: string[]
}

export interface PersonStats {
  id: string
  name: string
  messageCount: number
  wordCount: number
  avgWordsPerMessage: number
  avgReplyMs: number | null
  replyCount: number
  lateNightPct: number
  lateNightCount: number
  voiceCount: number
  longestVoiceSec: number
  mediaCount: number
  photoCount: number
  videoCount: number
  exclamationCount: number
  allCapsCount: number
  editedCount: number
  daysStarted: number
  longestMessageWords: number
  longestMessageChars: number
  longestMessagePreview: string
  avgMessageChars: number
  emojiCounts: Record<string, number>
  maxConsecutiveWithoutReply: number
  timesDoubleTexted: number
}

export interface DayActivity {
  dateKey: string
  counts: Record<string, number>
  total: number
  imbalance: number
  leaderId: string | null
}

export interface MonthBucket {
  /** YYYY-MM */
  key: string
  /** Short axis label */
  label: string
  count: number
}

export interface YearCompare {
  recentYear: number
  priorYear: number
  recentCount: number
  priorCount: number
}

export interface TopLexemeStat {
  value: string
  count: number
  leader: string | null
  kind: 'word' | 'phrase'
}

export interface WrappedStats {
  chatName: string
  year: number | null
  totalMessages: number
  dateRange: { start: Date; end: Date }
  /** Age of the filtered chat window (last − first message) */
  chatAgeMs: number
  you: PersonStats
  them: PersonStats
  people: PersonStats[]
  /** Milliseconds — longest wait before anyone replied */
  longestLeftOnReadMs: number
  longestLeftOnReadBy: string
  longestLeftOnReadAt: Date | null
  /** Biggest silent gap that eventually resumed */
  comebackGapMs: number
  comebackResumedAt: Date | null
  longestDailyStreak: number
  streakEndedOn: string | null
  primeHour: number
  primeDayOfWeek: number
  primeDayName: string
  /** Messages per hour of day (0–23) — for prime-time charts */
  hourHistogram: number[]
  /** Messages per weekday (0=Sun … 6=Sat) */
  dowHistogram: number[]
  /** Contiguous month buckets across the filtered range */
  monthHistogram: MonthBucket[]
  /** Present when the filtered export spans 2+ calendar years (all-time view) */
  yearCompare: YearCompare | null
  mostOneSidedDay: DayActivity | null
  topEmoji: string | null
  topEmojiCount: number
  topEmojiLeader: string | null
  /** Most common non-stop word (client-only lexical peek) */
  topWord: TopLexemeStat | null
  /** Most common 2-word phrase */
  topPhrase: TopLexemeStat | null
  badges: {
    fastestReplier: string
    nightOwl: string
    essayWriter: string
    streakMaster: string
    mostReliableOpener: string
  }
}
