import { useMemo, useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import type { WrappedStats } from '../types/telegram'
import { formatDuration, formatHour, formatNumber, formatPct, formatVoice } from '../lib/format'
import { StatCard } from './StatCard'
import { RacingPlanes } from './PaperPlane'

export interface StorySlide {
  id: string
  gradient: string
  render: () => ReactNode
}

export function buildSlides(stats: WrappedStats): StorySlide[] {
  const { you, them } = stats
  const yearLabel = stats.year ? String(stats.year) : 'this chat'
  const youFaster =
    you.avgReplyMs != null && them.avgReplyMs != null
      ? you.avgReplyMs <= them.avgReplyMs
      : true

  const doubleTexter = you.maxConsecutiveWithoutReply >= them.maxConsecutiveWithoutReply ? you : them
  const mediaKing = you.mediaCount >= them.mediaCount ? you : them
  const bangKing = you.exclamationCount >= them.exclamationCount ? you : them
  const capsKing = you.allCapsCount >= them.allCapsCount ? you : them
  const editKing = you.editedCount >= them.editedCount ? you : them
  const voiceKing = you.voiceCount >= them.voiceCount ? you : them
  const longestMsg = you.longestMessageWords >= them.longestMessageWords ? you : them

  return [
    {
      id: 'intro',
      gradient: 'var(--grad-intro)',
      render: () => (
        <StatCard
          mood="celebrate"
          eyebrow="Telegram Wrapped"
          headline={
            <>
              <span className="stat-card__mega">{formatNumber(stats.totalMessages)}</span>
              <span className="stat-card__mega-label">messages</span>
            </>
          }
          sub={
            <>
              Your year in <strong>{stats.chatName}</strong>
              {stats.year ? ` · ${yearLabel}` : ''}. Buckle up.
            </>
          }
        />
      ),
    },
    {
      id: 'volume',
      gradient: 'var(--grad-volume)',
      render: () => (
        <StatCard
          mood="idle"
          eyebrow="Who talks more?"
          headline={
            <span className="stat-card__mega">
              {you.messageCount >= them.messageCount ? you.name : them.name}
            </span>
          }
          sub={
            <>
              {formatNumber(you.messageCount)} from you · {formatNumber(them.messageCount)} from{' '}
              {them.name}.{' '}
              {you.messageCount >= them.messageCount
                ? 'You clearly had a lot to say.'
                : `${them.name} took the mic — respectfully.`}
            </>
          }
        >
          <div className="bar-compare">
            <div className="bar-compare__row">
              <span>You</span>
              <div className="bar-compare__track">
                <div
                  className="bar-compare__fill bar-compare__fill--you"
                  style={{
                    width: `${(you.messageCount / Math.max(you.messageCount, them.messageCount, 1)) * 100}%`,
                  }}
                />
              </div>
              <span>{formatNumber(you.messageCount)}</span>
            </div>
            <div className="bar-compare__row">
              <span>Them</span>
              <div className="bar-compare__track">
                <div
                  className="bar-compare__fill bar-compare__fill--them"
                  style={{
                    width: `${(them.messageCount / Math.max(you.messageCount, them.messageCount, 1)) * 100}%`,
                  }}
                />
              </div>
              <span>{formatNumber(them.messageCount)}</span>
            </div>
          </div>
        </StatCard>
      ),
    },
    {
      id: 'reply-speed',
      gradient: 'var(--grad-speed)',
      render: () => (
        <StatCard
          mood="race"
          eyebrow="Reply speed"
          headline={
            <>
              <span className="stat-card__line">
                You: <em>{you.avgReplyMs != null ? formatDuration(you.avgReplyMs) : '—'}</em>
              </span>
              <span className="stat-card__line stat-card__line--sm">
                {them.name}: {them.avgReplyMs != null ? formatDuration(them.avgReplyMs) : '—'}
              </span>
            </>
          }
          sub={
            youFaster
              ? 'Your paper plane left the hangar first. Fastest replier badge unlocked.'
              : `${them.name} usually landed first. Speed isn't everything… usually.`
          }
        >
          <RacingPlanes youFaster={youFaster} />
        </StatCard>
      ),
    },
    {
      id: 'left-on-read',
      gradient: 'var(--grad-read)',
      render: () => (
        <StatCard
          mood="think"
          eyebrow='The epic "left on read"'
          headline={<span className="stat-card__mega">{formatDuration(stats.longestLeftOnReadMs)}</span>}
          sub={
            stats.longestLeftOnReadBy
              ? `Longest wait before ${stats.longestLeftOnReadBy} replied. Worth the suspense.`
              : 'A legendary pause in the timeline.'
          }
        />
      ),
    },
    {
      id: 'night-owl',
      gradient: 'var(--grad-night)',
      render: () => (
        <StatCard
          mood="sleepy"
          eyebrow="Night owl energy"
          headline={<span className="stat-card__mega">{formatPct(you.lateNightPct)}</span>}
          sub={
            <>
              of <em>your</em> messages flew between 12am–4am.
              {them.lateNightPct > 0 && (
                <>
                  {' '}
                  {them.name}: {formatPct(them.lateNightPct)}. Badge goes to{' '}
                  <strong>{stats.badges.nightOwl}</strong>.
                </>
              )}
            </>
          }
        >
          <div className="moon" aria-hidden>
            ☾
          </div>
        </StatCard>
      ),
    },
    {
      id: 'streak',
      gradient: 'var(--grad-fire)',
      render: () => (
        <StatCard
          mood="fire"
          eyebrow="Daily streak"
          headline={
            <>
              <span className="stat-card__mega">{stats.longestDailyStreak}</span>
              <span className="stat-card__mega-label">days in a row</span>
            </>
          }
          sub="Without missing a single day. Streak Master energy."
        >
          <div className="fire-row" aria-hidden>
            <span>🔥</span>
            <span>🔥</span>
            <span>🔥</span>
          </div>
        </StatCard>
      ),
    },
    {
      id: 'prime-time',
      gradient: 'var(--grad-prime)',
      render: () => (
        <StatCard
          mood="idle"
          eyebrow="Prime time"
          headline={
            <>
              <span className="stat-card__mega">{stats.primeDayName}</span>
              <span className="stat-card__mega-label">around {formatHour(stats.primeHour)}</span>
            </>
          }
          sub="That's when this chat hits peak altitude."
        />
      ),
    },
    {
      id: 'opener',
      gradient: 'var(--grad-opener)',
      render: () => (
        <StatCard
          mood="celebrate"
          eyebrow="Who starts the day?"
          headline={<span className="stat-card__mega">{stats.badges.mostReliableOpener}</span>}
          sub={
            <>
              Most reliable opener — {you.daysStarted} days started by you, {them.daysStarted} by{' '}
              {them.name}.
            </>
          }
        />
      ),
    },
    {
      id: 'double-text',
      gradient: 'var(--grad-double)',
      render: () => (
        <StatCard
          mood="cheeky"
          eyebrow="Double-texter diaries"
          headline={
            <>
              <span className="stat-card__mega">{doubleTexter.maxConsecutiveWithoutReply}</span>
              <span className="stat-card__mega-label">in a row</span>
            </>
          }
          sub={
            <>
              {doubleTexter.name}'s longest no-reply streak.
              {doubleTexter.timesDoubleTexted > 0 && (
                <>
                  {' '}
                  They double+ texted {formatNumber(doubleTexter.timesDoubleTexted)} times. Commitment.
                </>
              )}
            </>
          }
        />
      ),
    },
    {
      id: 'one-sided',
      gradient: 'var(--grad-onesided)',
      render: () => {
        const d = stats.mostOneSidedDay
        const leader =
          d?.leaderId === you.id ? you.name : d?.leaderId === them.id ? them.name : 'someone'
        return (
          <StatCard
            mood="cheeky"
            eyebrow="Most one-sided day"
            headline={<span className="stat-card__mega">{d ? formatNumber(d.imbalance) : '0'}</span>}
            sub={
              d
                ? `Message gap on ${d.dateKey}. ${leader} carried the chat that day.`
                : 'Surprisingly balanced. Weirdly wholesome.'
            }
          />
        )
      },
    },
    {
      id: 'voice',
      gradient: 'var(--grad-voice)',
      render: () => (
        <StatCard
          mood="idle"
          eyebrow="Voice notes"
          headline={
            <>
              <span className="stat-card__mega">{formatNumber(you.voiceCount + them.voiceCount)}</span>
              <span className="stat-card__mega-label">voice messages</span>
            </>
          }
          sub={
            <>
              Longest: {formatVoice(Math.max(you.longestVoiceSec, them.longestVoiceSec))}
              {voiceKing.voiceCount > 0 && (
                <>
                  {' '}
                  · {voiceKing.name} sent the most ({formatNumber(voiceKing.voiceCount)}).
                </>
              )}
            </>
          }
        />
      ),
    },
    {
      id: 'media',
      gradient: 'var(--grad-media)',
      render: () => (
        <StatCard
          mood="emoji"
          eyebrow="Photos & videos"
          headline={<span className="stat-card__mega">{formatNumber(mediaKing.mediaCount)}</span>}
          sub={
            <>
              {mediaKing.name} shared the most media
              {mediaKing.photoCount || mediaKing.videoCount
                ? ` (${formatNumber(mediaKing.photoCount)} photos · ${formatNumber(mediaKing.videoCount)} videos)`
                : ''}
              .
            </>
          }
        />
      ),
    },
    {
      id: 'essay',
      gradient: 'var(--grad-essay)',
      render: () => (
        <StatCard
          mood="scroll"
          eyebrow="The essay writer"
          headline={
            <>
              <span className="stat-card__mega">{formatNumber(longestMsg.longestMessageWords)}</span>
              <span className="stat-card__mega-label">words in one message</span>
            </>
          }
          sub={
            <>
              {longestMsg.name}'s magnum opus. Avg words/msg: you {you.avgWordsPerMessage.toFixed(1)} ·{' '}
              {them.name} {them.avgWordsPerMessage.toFixed(1)}. Badge:{' '}
              <strong>{stats.badges.essayWriter}</strong>.
            </>
          }
        >
          <div className="scroll-icon" aria-hidden>
            📜
          </div>
        </StatCard>
      ),
    },
    {
      id: 'chaos',
      gradient: 'var(--grad-chaos)',
      render: () => (
        <StatCard
          mood="cheeky"
          eyebrow="Chaos metadata"
          headline={<span className="stat-card__line">Spicy punctuation</span>}
          sub="Still content-blind. Just vibes and punctuation."
        >
          <ul className="chaos-list">
            <li>
              <span>!</span> {bangKing.name} — {formatNumber(bangKing.exclamationCount)} bangs
            </li>
            <li>
              <span>AA</span> {capsKing.name} — {formatNumber(capsKing.allCapsCount)} all-caps
            </li>
            <li>
              <span>✎</span> {editKing.name} — {formatNumber(editKing.editedCount)} edits
            </li>
          </ul>
        </StatCard>
      ),
    },
    {
      id: 'emoji',
      gradient: 'var(--grad-emoji)',
      render: () => (
        <StatCard
          mood="emoji"
          eyebrow="Emoji royalty"
          headline={
            <span className="stat-card__mega emoji-hero">{stats.topEmoji ?? '✈️'}</span>
          }
          sub={
            stats.topEmoji
              ? `Used ${formatNumber(stats.topEmojiCount)} times. ${
                  stats.topEmojiLeader ? `${stats.topEmojiLeader} wore the crown.` : ''
                }`
              : 'A surprisingly emoji-free zone. Minimalist icons.'
          }
        />
      ),
    },
    {
      id: 'comeback',
      gradient: 'var(--grad-comeback)',
      render: () => (
        <StatCard
          mood="think"
          eyebrow="The comeback"
          headline={<span className="stat-card__mega">{formatDuration(stats.comebackGapMs)}</span>}
          sub="Biggest gap before the chat picked back up. Absence makes the paper plane fly farther."
        />
      ),
    },
    {
      id: 'badges',
      gradient: 'var(--grad-badges)',
      render: () => (
        <StatCard mood="celebrate" eyebrow="Superlative cards" headline={<span className="stat-card__line">Your badges</span>}>
          <ul className="badge-grid">
            <li>
              <strong>Fastest replier</strong>
              <span>{stats.badges.fastestReplier}</span>
            </li>
            <li>
              <strong>Night owl</strong>
              <span>{stats.badges.nightOwl}</span>
            </li>
            <li>
              <strong>Essay writer</strong>
              <span>{stats.badges.essayWriter}</span>
            </li>
            <li>
              <strong>Streak master</strong>
              <span>{stats.badges.streakMaster}</span>
            </li>
            <li>
              <strong>Reliable opener</strong>
              <span>{stats.badges.mostReliableOpener}</span>
            </li>
          </ul>
        </StatCard>
      ),
    },
    {
      id: 'summary',
      gradient: 'var(--grad-summary)',
      render: () => <SummaryGrid stats={stats} />,
    },
  ]
}

function SummaryGrid({ stats }: { stats: WrappedStats }) {
  const ref = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const cells = useMemo(
    () => [
      { label: 'Messages', value: formatNumber(stats.totalMessages) },
      {
        label: 'Your avg reply',
        value: stats.you.avgReplyMs != null ? formatDuration(stats.you.avgReplyMs) : '—',
      },
      { label: 'Night owl %', value: formatPct(stats.you.lateNightPct) },
      { label: 'Day streak', value: String(stats.longestDailyStreak) },
      { label: 'Prime time', value: `${stats.primeDayName.slice(0, 3)} ${formatHour(stats.primeHour)}` },
      { label: 'Top emoji', value: stats.topEmoji ?? '✈️' },
    ],
    [stats],
  )

  async function exportImage() {
    if (!ref.current) return
    setSaving(true)
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#1a0a2e',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `telegram-wrapped-${stats.chatName.replace(/\s+/g, '-').toLowerCase()}.png`
      a.click()
    } catch {
      // ignore — user can screenshot
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="summary-wrap">
      <div className="summary-grid" ref={ref}>
        <header className="summary-grid__header">
          <p>Telegram Wrapped</p>
          <h2>{stats.chatName}</h2>
          <span>{stats.year ?? 'All time'} · {formatNumber(stats.totalMessages)} messages</span>
        </header>
        <div className="summary-grid__cells">
          {cells.map((c) => (
            <div key={c.label} className="summary-cell">
              <span className="summary-cell__value">{c.value}</span>
              <span className="summary-cell__label">{c.label}</span>
            </div>
          ))}
        </div>
        <footer className="summary-grid__footer">
          <span>✈️ telegram wrapped</span>
          <span>
            {stats.badges.fastestReplier} · fastest · {stats.badges.nightOwl} · night owl
          </span>
        </footer>
      </div>
      <button type="button" className="btn btn--export" onClick={exportImage} disabled={saving}>
        {saving ? 'Saving…' : 'Export as image'}
      </button>
    </div>
  )
}
