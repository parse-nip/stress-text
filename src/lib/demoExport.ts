import type { TelegramExport } from '../types/telegram'

function iso(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, '')
}

function unix(d: Date): string {
  return String(Math.floor(d.getTime() / 1000))
}

function msg(
  id: number,
  from: string,
  fromId: string,
  date: Date,
  text: string,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    type: 'message',
    date: iso(date),
    date_unixtime: unix(date),
    from,
    from_id: fromId,
    text,
    ...extra,
  }
}

/** Synthetic 1:1 chat so the UI is demoable without a real export. */
export function buildDemoExport(): TelegramExport {
  const you = 'Alex'
  const them = 'Sam'
  const youId = 'user1001'
  const themId = 'user2002'
  const messages: TelegramExport['messages'] = []
  let id = 1

  // Seed late 2024 so year-vs-year + monthly sparkline have range
  const priorStart = new Date('2024-11-01T10:00:00')
  for (let day = 0; day < 40; day++) {
    const base = new Date(priorStart)
    base.setDate(priorStart.getDate() + day)
    const morning = new Date(base)
    morning.setHours(10, 0, 0, 0)
    messages.push(msg(id++, you, youId, morning, 'coffee run later?'))
    messages.push(
      msg(id++, them, themId, new Date(morning.getTime() + 5 * 60_000), 'coffee run sounds perfect'),
    )
    messages.push(
      msg(id++, you, youId, new Date(morning.getTime() + 12 * 60_000), 'yes coffee run confirmed'),
    )
  }

  const start = new Date('2025-01-05T10:00:00')
  // ~50 days of messaging with a gap in the middle for "comeback"
  for (let day = 0; day < 55; day++) {
    if (day >= 30 && day < 40) continue // 10-day silence → comeback
    const base = new Date(start)
    base.setDate(start.getDate() + day)

    const openerIsYou = day % 3 !== 0
    const morning = new Date(base)
    morning.setHours(openerIsYou ? 9 : 11, 12, 0, 0)

    if (openerIsYou) {
      messages.push(msg(id++, you, youId, morning, day % 5 === 0 ? 'GOOD MORNING!!!' : 'hey hey'))
      const reply = new Date(morning.getTime() + (day % 4 === 0 ? 45 * 60_000 : 4 * 60_000))
      messages.push(msg(id++, them, themId, reply, 'hey! whats up 😎'))
    } else {
      messages.push(msg(id++, them, themId, morning, 'yo'))
      const reply = new Date(morning.getTime() + 18 * 60_000)
      messages.push(msg(id++, you, youId, reply, 'omw ✈️'))
    }

    // afternoon pile
    const aft = new Date(base)
    aft.setHours(15, 30 + (day % 10), 0, 0)
    messages.push(msg(id++, you, youId, aft, 'okay so hear me out ' + 'really '.repeat((day % 7) + 1) + 'long thought 🔥'))
    messages.push(
      msg(id++, you, youId, new Date(aft.getTime() + 20_000), 'also this', {
        edited: iso(new Date(aft.getTime() + 60_000)),
        edited_unixtime: unix(new Date(aft.getTime() + 60_000)),
      }),
    )
    if (day % 5 === 0) {
      messages.push(
        msg(id++, them, themId, new Date(aft.getTime() + 90_000), 'wait no', {
          edited: iso(new Date(aft.getTime() + 4 * 60_000)),
          edited_unixtime: unix(new Date(aft.getTime() + 4 * 60_000)),
        }),
      )
    }
    messages.push(
      msg(id++, you, youId, new Date(aft.getTime() + 40_000), 'and this too lol'),
    )
    const theirReply = new Date(aft.getTime() + (day === 12 ? 3 * 86_400_000 : 8 * 60_000))
    messages.push(msg(id++, them, themId, theirReply, day === 12 ? 'sorry just saw this 😅' : 'lol fair 🔥'))

    // late night every few days
    if (day % 4 === 0) {
      const night = new Date(base)
      night.setHours(1, 20, 0, 0)
      messages.push(msg(id++, you, youId, night, 'are you awake 👀'))
      messages.push(
        msg(id++, them, themId, new Date(night.getTime() + 3 * 60_000), 'barely', {
          media_type: 'voice_message',
          duration_seconds: 12 + (day % 40),
          text: '',
        }),
      )
    }

    // comedy hour — pile of laughs around 9pm
    if (day % 2 === 0) {
      const funny = new Date(base)
      funny.setHours(21, 10 + (day % 20), 0, 0)
      messages.push(msg(id++, them, themId, funny, 'wait what hahaha'))
      messages.push(
        msg(id++, you, youId, new Date(funny.getTime() + 25_000), 'lol stopppp hahahaha'),
      )
      messages.push(msg(id++, them, themId, new Date(funny.getTime() + 50_000), 'lmao okay 😂'))
    }

    // media
    if (day % 6 === 0) {
      const pic = new Date(base)
      pic.setHours(19, 0, 0, 0)
      messages.push(msg(id++, them, themId, pic, '', { photo: 'photos/photo.jpg' }))
    }
    if (day % 9 === 0) {
      const stick = new Date(base)
      stick.setHours(20, 15, 0, 0)
      messages.push(
        msg(id++, you, youId, stick, '', {
          media_type: 'sticker',
          sticker_emoji: '✈️',
        }),
      )
    }
  }

  // one essay
  const essayDate = new Date('2025-02-14T22:10:00')
  const essay =
    'Okay so I have been thinking about this for a while and I just need to get it all out in one place. '.repeat(
      8,
    ) + 'THE END!!!'
  messages.push(msg(id++, you, youId, essayDate, essay))

  return {
    name: 'Sam',
    type: 'personal_chat',
    id: 424242,
    messages,
  }
}
