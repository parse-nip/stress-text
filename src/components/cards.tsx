import { useMemo, useRef, useState, type ReactNode } from 'react'
import { toPng } from 'html-to-image'
import type { WrappedStats } from '../types/telegram'
import { formatDuration, formatHour, formatNumber, formatPct, formatVoice } from '../lib/format'
import { StatCard } from './StatCard'
import {
  ArcGauge,
  HorizontalRankBars,
  MediaStack,
  SplitDonut,
  SpeedMeters,
  StreakDots,
  VerticalBars,
  Waveform,
} from './Charts'

const DOW_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function hourLabels(hourHistogram: number[], highlightHour: number) {
  return hourHistogram.map((value, h) => ({
    label: h % 3 === 0 ? String(h) : '',
    value,
    highlight: h === highlightHour,
  }))
}

function dowLabels(dowHistogram: number[], highlightDow: number) {
  return dowHistogram.map((value, d) => ({
    label: DOW_SHORT[d],
    value,
    highlight: d === highlightDow,
  }))
}

export type StoryPattern =
  | 'ribbons'
  | 'dots'
  | 'stripes'
  | 'circles'
  | 'rays'
  | 'grid'
  | 'waves'
  | 'arcs'
  | 'halftone'
  | 'zigzag'
  | 'blocks'
  | 'none'

export interface StorySlide {
  id: string
  gradient: string
  pattern: StoryPattern
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

  const hours = hourLabels(stats.hourHistogram, stats.primeHour)
  const days = dowLabels(stats.dowHistogram, stats.primeDayOfWeek)

  return [
    {
      id: 'intro',
      gradient: 'var(--grad-intro)',
      pattern: 'blocks',
      render: () => (
        <StatCard
          mood="celebrate"
          layout="hero"
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
      pattern: 'circles',
      render: () => (
        <StatCard
          mood="idle"
          layout="chart"
          eyebrow="Who talks more?"
          headline={
            <span className="stat-card__line">
              {you.messageCount >= them.messageCount ? you.name : them.name}
            </span>
          }
          sub={
            you.messageCount >= them.messageCount
              ? 'You clearly had a lot to say.'
              : `${them.name} took the mic — respectfully.`
          }
        >
          <SplitDonut
            a={you.messageCount}
            b={them.messageCount}
            aLabel={`You · ${formatNumber(you.messageCount)}`}
            bLabel={`${them.name} · ${formatNumber(them.messageCount)}`}
          />
        </StatCard>
      ),
    },
    {
      id: 'reply-speed',
      gradient: 'var(--grad-speed)',
      pattern: 'rays',
      render: () => (
        <StatCard
          mood="race"
          layout="chart"
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
              ? 'Your paper plane left the hangar first.'
              : `${them.name} usually landed first. Speed isn't everything… usually.`
          }
        >
          <SpeedMeters youMs={you.avgReplyMs} themMs={them.avgReplyMs} themName={them.name} />
        </StatCard>
      ),
    },
    {
      id: 'left-on-read',
      gradient: 'var(--grad-read)',
      pattern: 'halftone',
      render: () => (
        <StatCard
          mood="think"
          layout="hero"
          eyebrow='The epic "left on read"'
          headline={<span className="stat-card__mega">{formatDuration(stats.longestLeftOnReadMs)}</span>}
          sub={
            stats.longestLeftOnReadBy
              ? `Longest wait before ${stats.longestLeftOnReadBy} replied. Worth the suspense.`
              : 'A legendary pause in the timeline.'
          }
        >
          <div className="viz-timeline" aria-hidden>
            <span className="viz-timeline__dot" />
            <span className="viz-timeline__gap" />
            <span className="viz-timeline__dot viz-timeline__dot--end" />
          </div>
        </StatCard>
      ),
    },
    {
      id: 'night-owl',
      gradient: 'var(--grad-night)',
      pattern: 'dots',
      render: () => (
        <StatCard
          mood="sleepy"
          layout="chart"
          eyebrow="Night owl energy"
          headline={<span className="stat-card__line">After midnight</span>}
          sub={
            <>
              of <em>your</em> messages flew between 12am–4am. Badge:{' '}
              <strong>{stats.badges.nightOwl}</strong>.
            </>
          }
        >
          <ArcGauge value={you.lateNightPct} label={`${them.name}: ${formatPct(them.lateNightPct)}`} />
        </StatCard>
      ),
    },
    {
      id: 'streak',
      gradient: 'var(--grad-fire)',
      pattern: 'zigzag',
      render: () => (
        <StatCard
          mood="fire"
          layout="chart"
          eyebrow="Daily streak"
          headline={
            <>
              <span className="stat-card__mega">{stats.longestDailyStreak}</span>
              <span className="stat-card__mega-label">days in a row</span>
            </>
          }
          sub="Without missing a single day. Streak Master energy."
        >
          <StreakDots count={stats.longestDailyStreak} />
        </StatCard>
      ),
    },
    {
      id: 'prime-time',
      gradient: 'var(--grad-prime)',
      pattern: 'stripes',
      render: () => (
        <StatCard
          mood="idle"
          layout="chart"
          eyebrow="Prime time"
          headline={
            <>
              <span className="stat-card__line">{stats.primeDayName}</span>
              <span className="stat-card__mega-label">around {formatHour(stats.primeHour)}</span>
            </>
          }
          sub="That's when this chat hits peak altitude."
        >
          <VerticalBars items={hours} className="chart-vbars--hours" />
          <p className="chart-caption">Messages by hour · peak highlighted</p>
          <div className="week-strip" aria-label="Messages by weekday">
            {days.map((d, i) => {
              const max = Math.max(...days.map((x) => x.value), 1)
              return (
                <div
                  key={`dow-${i}`}
                  className={`week-strip__day${d.highlight ? ' week-strip__day--hot' : ''}`}
                >
                  <div
                    className="week-strip__fill"
                    style={{ height: `${(d.value / max) * 100}%` }}
                  />
                  <span>{d.label}</span>
                </div>
              )
            })}
          </div>
        </StatCard>
      ),
    },
    {
      id: 'opener',
      gradient: 'var(--grad-opener)',
      pattern: 'arcs',
      render: () => (
        <StatCard
          mood="celebrate"
          layout="chart"
          eyebrow="Who starts the day?"
          headline={<span className="stat-card__line">{stats.badges.mostReliableOpener}</span>}
          sub="Most reliable opener — first message of the day."
        >
          <HorizontalRankBars
            items={[
              { label: 'You', value: you.daysStarted, display: String(you.daysStarted) },
              { label: them.name, value: them.daysStarted, display: String(them.daysStarted) },
            ]}
          />
        </StatCard>
      ),
    },
    {
      id: 'double-text',
      gradient: 'var(--grad-double)',
      pattern: 'grid',
      render: () => (
        <StatCard
          mood="cheeky"
          layout="chart"
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
                <> They double+ texted {formatNumber(doubleTexter.timesDoubleTexted)} times.</>
              )}
            </>
          }
        >
          <HorizontalRankBars
            items={[
              {
                label: 'You',
                value: you.maxConsecutiveWithoutReply,
                display: String(you.maxConsecutiveWithoutReply),
              },
              {
                label: them.name,
                value: them.maxConsecutiveWithoutReply,
                display: String(them.maxConsecutiveWithoutReply),
              },
            ]}
          />
        </StatCard>
      ),
    },
    {
      id: 'one-sided',
      gradient: 'var(--grad-onesided)',
      pattern: 'stripes',
      render: () => {
        const d = stats.mostOneSidedDay
        const leader =
          d?.leaderId === you.id ? you.name : d?.leaderId === them.id ? them.name : 'someone'
        const youN = d ? (d.counts[you.id] ?? 0) : 0
        const themN = d ? (d.counts[them.id] ?? 0) : 0
        return (
          <StatCard
            mood="cheeky"
            layout="chart"
            eyebrow="Most one-sided day"
            headline={<span className="stat-card__mega">{d ? formatNumber(d.imbalance) : '0'}</span>}
            sub={
              d
                ? `Message gap on ${d.dateKey}. ${leader} carried the chat that day.`
                : 'Surprisingly balanced. Weirdly wholesome.'
            }
          >
            {d ? (
              <HorizontalRankBars
                items={[
                  { label: 'You', value: youN, display: formatNumber(youN) },
                  { label: them.name, value: themN, display: formatNumber(themN) },
                ]}
              />
            ) : null}
          </StatCard>
        )
      },
    },
    {
      id: 'voice',
      gradient: 'var(--grad-voice)',
      pattern: 'waves',
      render: () => (
        <StatCard
          mood="idle"
          layout="chart"
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
                <> · {voiceKing.name} sent the most ({formatNumber(voiceKing.voiceCount)}).</>
              )}
            </>
          }
        >
          <Waveform />
          <HorizontalRankBars
            items={[
              { label: 'You', value: you.voiceCount, display: formatNumber(you.voiceCount) },
              { label: them.name, value: them.voiceCount, display: formatNumber(them.voiceCount) },
            ]}
          />
        </StatCard>
      ),
    },
    {
      id: 'media',
      gradient: 'var(--grad-media)',
      pattern: 'blocks',
      render: () => (
        <StatCard
          mood="emoji"
          layout="chart"
          eyebrow="Photos & videos"
          headline={<span className="stat-card__mega">{formatNumber(mediaKing.mediaCount)}</span>}
          sub={<>{mediaKing.name} shared the most media.</>}
        >
          <MediaStack
            photos={you.photoCount + them.photoCount}
            videos={you.videoCount + them.videoCount}
          />
        </StatCard>
      ),
    },
    {
      id: 'essay',
      gradient: 'var(--grad-essay)',
      pattern: 'ribbons',
      render: () => (
        <StatCard
          mood="scroll"
          layout="chart"
          eyebrow="The essay writer"
          headline={
            <>
              <span className="stat-card__mega">{formatNumber(longestMsg.longestMessageWords)}</span>
              <span className="stat-card__mega-label">words in one message</span>
            </>
          }
          sub={
            <>
              {longestMsg.name}'s magnum opus. Badge: <strong>{stats.badges.essayWriter}</strong>.
            </>
          }
        >
          <HorizontalRankBars
            items={[
              {
                label: 'You avg',
                value: you.avgWordsPerMessage,
                display: you.avgWordsPerMessage.toFixed(1),
              },
              {
                label: `${them.name} avg`,
                value: them.avgWordsPerMessage,
                display: them.avgWordsPerMessage.toFixed(1),
              },
            ]}
          />
        </StatCard>
      ),
    },
    {
      id: 'chaos',
      gradient: 'var(--grad-chaos)',
      pattern: 'zigzag',
      render: () => (
        <StatCard
          mood="cheeky"
          layout="chart"
          eyebrow="Chaos metadata"
          headline={<span className="stat-card__line">Spicy punctuation</span>}
          sub="Still content-blind. Just vibes and punctuation."
        >
          <HorizontalRankBars
            items={[
              {
                label: `! · ${bangKing.name}`,
                value: bangKing.exclamationCount,
                display: formatNumber(bangKing.exclamationCount),
              },
              {
                label: `CAPS · ${capsKing.name}`,
                value: capsKing.allCapsCount,
                display: formatNumber(capsKing.allCapsCount),
              },
              {
                label: `Edits · ${editKing.name}`,
                value: editKing.editedCount,
                display: formatNumber(editKing.editedCount),
              },
            ]}
          />
        </StatCard>
      ),
    },
    {
      id: 'emoji',
      gradient: 'var(--grad-emoji)',
      pattern: 'dots',
      render: () => (
        <StatCard
          mood="emoji"
          layout="hero"
          eyebrow="Emoji royalty"
          headline={<span className="stat-card__mega emoji-hero">{stats.topEmoji ?? '✈️'}</span>}
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
      pattern: 'halftone',
      render: () => (
        <StatCard
          mood="think"
          layout="hero"
          eyebrow="The comeback"
          headline={<span className="stat-card__mega">{formatDuration(stats.comebackGapMs)}</span>}
          sub="Biggest gap before the chat picked back up. Absence makes the paper plane fly farther."
        >
          <div className="viz-timeline viz-timeline--long" aria-hidden>
            <span className="viz-timeline__dot" />
            <span className="viz-timeline__gap" />
            <span className="viz-timeline__dot viz-timeline__dot--end" />
          </div>
        </StatCard>
      ),
    },
    {
      id: 'badges',
      gradient: 'var(--grad-badges)',
      pattern: 'circles',
      render: () => (
        <StatCard
          mood="celebrate"
          layout="chart"
          eyebrow="Superlative cards"
          headline={<span className="stat-card__line">Your badges</span>}
        >
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
      pattern: 'none',
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
        backgroundColor: '#0a0410',
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
          <span>
            {stats.year ?? 'All time'} · {formatNumber(stats.totalMessages)} messages
          </span>
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
