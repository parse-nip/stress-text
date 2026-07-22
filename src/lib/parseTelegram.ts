import type {
  ParsedMessage,
  TelegramExport,
  TelegramRawMessage,
  TelegramTextEntity,
} from '../types/telegram'

const EMOJI_RE =
  /(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*)|\p{Regional_Indicator}{2}/gu

function flattenText(text: TelegramTextEntity | TelegramTextEntity[] | undefined): string {
  if (text == null) return ''
  if (typeof text === 'string') return text
  if (Array.isArray(text)) {
    return text.map((part) => (typeof part === 'string' ? part : part.text ?? '')).join('')
  }
  return text.text ?? ''
}

function countWords(s: string): number {
  const trimmed = s.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

function extractEmojis(s: string): string[] {
  return s.match(EMOJI_RE) ?? []
}

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 4) return false
  return letters === letters.toUpperCase() && /[A-Z]/.test(letters)
}

function parseDate(msg: TelegramRawMessage): Date {
  if (msg.date_unixtime) {
    const ms = Number(msg.date_unixtime) * 1000
    if (!Number.isNaN(ms)) return new Date(ms)
  }
  return new Date(msg.date)
}

export function parseMessage(raw: TelegramRawMessage): ParsedMessage | null {
  if (raw.type !== 'message') return null
  const from = raw.from ?? raw.actor
  const fromId = raw.from_id ?? raw.actor_id
  if (!from || !fromId) return null

  const text = flattenText(raw.text)
  const mediaType = raw.media_type ?? ''
  const isVoice = mediaType === 'voice_message' || mediaType === 'audio_file'
  const isVideo =
    mediaType === 'video_file' ||
    mediaType === 'video_message' ||
    mediaType === 'animation' ||
    Boolean(raw.mime_type?.startsWith('video/'))
  const isPhoto = Boolean(raw.photo) && !isVideo
  const isSticker = mediaType === 'sticker'
  const stickerEmoji = raw.sticker_emoji ?? null
  const emojis = [
    ...extractEmojis(text),
    ...(stickerEmoji ? [stickerEmoji] : []),
  ]

  return {
    id: raw.id,
    date: parseDate(raw),
    from,
    fromId,
    text,
    wordCount: countWords(text),
    charCount: text.length,
    isVoice,
    voiceDurationSec: isVoice ? (raw.duration_seconds ?? 0) : 0,
    isPhoto,
    isVideo,
    isSticker,
    stickerEmoji,
    isEdited: Boolean(raw.edited || raw.edited_unixtime),
    exclamationCount: (text.match(/!/g) ?? []).length,
    isAllCaps: isAllCaps(text),
    emojis,
  }
}

export function parseExport(data: unknown): { exportMeta: TelegramExport; messages: ParsedMessage[] } {
  if (!data || typeof data !== 'object') {
    throw new Error('That file does not look like a Telegram export.')
  }
  const exp = data as TelegramExport
  if (!Array.isArray(exp.messages)) {
    throw new Error('Missing messages array — export the chat as JSON from Telegram Desktop.')
  }

  const messages = exp.messages
    .map(parseMessage)
    .filter((m): m is ParsedMessage => m != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (messages.length === 0) {
    throw new Error('No readable messages found in this export.')
  }

  return {
    exportMeta: {
      name: exp.name ?? 'Untitled chat',
      type: exp.type ?? 'personal_chat',
      id: exp.id ?? 0,
      messages: exp.messages,
    },
    messages,
  }
}

/** Pick the two most talkative people as "you" and "them". Caller can swap. */
export function detectParticipants(messages: ParsedMessage[]): { id: string; name: string; count: number }[] {
  const map = new Map<string, { id: string; name: string; count: number }>()
  for (const m of messages) {
    const cur = map.get(m.fromId)
    if (cur) {
      cur.count += 1
      // Prefer the most recent display name
      cur.name = m.from
    } else {
      map.set(m.fromId, { id: m.fromId, name: m.from, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}
