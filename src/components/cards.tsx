import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { toPng } from 'html-to-image'
import type { WrappedStats } from '../types/telegram'
import { flipPerspective } from '../lib/computeStats'
import {
  formatDuration,
  formatHour,
  formatLongDate,
  formatNumber,
  formatPct,
  who,
} from '../lib/format'
import {
  anniversaryCopy,
  badgesHeadline,
  chaosCopy,
  comebackCopy,
  doubleTextCopy,
  editSpiralCopy,
  emojiCopy,
  essayCopy,
  funniestHourCopy,
  introCopy,
  leftOnReadCopy,
  lexCopy,
  mediaCopy,
  monthlyCopy,
  nightOwlCopy,
  oneSidedCopy,
  openerCopy,
  polishVsReplyCopy,
  primeTimeCopy,
  replySpeedCopy,
  streakCopy,
  voiceCopy,
  volumeCopy,
  yearCompareCopy,
} from '../lib/flavorCopy'
import { StatCard } from './StatCard'
import { LaughCascade, RewriteSpiral, StarField } from './CardMotifs'
import {
  ArcGauge,
  HorizontalRankBars,
  MediaStack,
  MonthSparkline,
  SplitDonut,
  SpeedMeters,
  StreakDots,
  VerticalBars,
  Waveform,
  YearCompareBars,
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
  /** Freeze auto-advance (used on the final download slide). */
  hold?: boolean
  render: () => ReactNode
}

export function buildSlides(stats: WrappedStats): StorySlide[] {
  const { you, them } = stats

  const doubleTexter = you.maxConsecutiveWithoutReply >= them.maxConsecutiveWithoutReply ? you : them
  const mediaKing = you.mediaCount >= them.mediaCount ? you : them
  const bangKing = you.exclamationCount >= them.exclamationCount ? you : them
  const capsKing = you.allCapsCount >= them.allCapsCount ? you : them
  const longestMsg = you.longestMessageWords >= them.longestMessageWords ? you : them

  const hours = hourLabels(stats.hourHistogram, stats.primeHour)
  const days = dowLabels(stats.dowHistogram, stats.primeDayOfWeek)

  const youName = you.name
  const asYou = (name: string) => who(youName, name)
  const lex = stats.topPhrase && stats.topPhrase.count >= (stats.topWord?.count ?? 0)
    ? stats.topPhrase
    : stats.topWord

  const copy = {
    intro: introCopy(stats),
    anniversary: anniversaryCopy(stats),
    monthly: monthlyCopy(stats),
    yearCompare: yearCompareCopy(stats),
    volume: volumeCopy(stats),
    reply: replySpeedCopy(stats),
    leftOnRead: leftOnReadCopy(stats),
    night: nightOwlCopy(stats),
    streak: streakCopy(stats),
    prime: primeTimeCopy(stats),
    funniest: funniestHourCopy(stats),
    opener: openerCopy(stats),
    double: doubleTextCopy(stats),
    oneSided: oneSidedCopy(stats),
    voice: voiceCopy(stats),
    media: mediaCopy(stats),
    essay: essayCopy(stats),
    editSpiral: editSpiralCopy(stats),
    polishVsReply: polishVsReplyCopy(stats),
    chaos: chaosCopy(stats),
    lex: lexCopy(stats),
    emoji: emojiCopy(stats),
    comeback: comebackCopy(stats),
    badges: badgesHeadline(stats),
  }

  const slides: StorySlide[] = [
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
          sub={copy.intro}
        />
      ),
    },
    {
      id: 'anniversary',
      gradient: 'var(--grad-opener)',
      pattern: 'arcs',
      render: () => (
        <StatCard
          mood="celebrate"
          layout="hero"
          eyebrow="Chat anniversary"
          headline={
            <>
              <span className="stat-card__line">Since</span>
              <span className="stat-card__mega stat-card__mega--date">
                {formatLongDate(stats.dateRange.start)}
              </span>
            </>
          }
          sub={copy.anniversary}
        >
          <p className="chart-caption">{formatDuration(stats.chatAgeMs)} together in this thread</p>
        </StatCard>
      ),
    },
  ]

  if (stats.monthHistogram.length >= 2) {
    slides.push({
      id: 'monthly',
      gradient: 'var(--grad-prime)',
      pattern: 'waves',
      render: () => (
        <StatCard
          mood="idle"
          layout="chart"
          eyebrow="Over time"
          headline={<span className="stat-card__line">Messages by month</span>}
          sub={copy.monthly}
        >
          <MonthSparkline
            values={stats.monthHistogram.map((m) => m.count)}
            labels={stats.monthHistogram.map((m) => m.label)}
          />
        </StatCard>
      ),
    })
  }

  if (stats.yearCompare) {
    const yc = stats.yearCompare
    slides.push({
      id: 'year-compare',
      gradient: 'var(--grad-volume)',
      pattern: 'stripes',
      render: () => (
        <StatCard
          mood="race"
          layout="chart"
          eyebrow="Year vs year"
          headline={
            <span className="stat-card__line">
              {yc.recentYear} vs {yc.priorYear}
            </span>
          }
          sub={copy.yearCompare}
        >
          <YearCompareBars
            priorYear={yc.priorYear}
            recentYear={yc.recentYear}
            priorCount={yc.priorCount}
            recentCount={yc.recentCount}
          />
        </StatCard>
      ),
    })
  }

  slides.push(
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
              {you.messageCount >= them.messageCount ? 'You' : them.name}
            </span>
          }
          sub={copy.volume}
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
          sub={copy.reply}
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
          sub={copy.leftOnRead}
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
        <div className="motif-wrap">
          <StarField />
          <StatCard
            mood="sleepy"
            layout="chart"
            eyebrow="Night owl energy"
            headline={<span className="stat-card__line">After midnight</span>}
            sub={copy.night}
          >
            <ArcGauge value={you.lateNightPct} label={`${them.name}: ${formatPct(them.lateNightPct)}`} />
          </StatCard>
        </div>
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
          sub={copy.streak}
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
          sub={copy.prime}
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
    ...(stats.funniestHour >= 0 && stats.funniestHourLaughs > 0
      ? ([
          {
            id: 'funniest-hour',
            gradient: 'var(--grad-double)',
            pattern: 'none',
            render: () => (
              <div className="laugh-slide">
                <LaughCascade />
                <StatCard
                  mood="cheeky"
                  layout="hero"
                  eyebrow="Funniest hour"
                  headline={
                    <>
                      <span className="stat-card__mega">{formatHour(stats.funniestHour)}</span>
                      <span className="stat-card__mega-label">
                        {formatNumber(stats.funniestHourLaughs)} laughs
                      </span>
                    </>
                  }
                  sub={copy.funniest}
                />
              </div>
            ),
          },
        ] as StorySlide[])
      : []),
    {
      id: 'opener',
      gradient: 'var(--grad-opener)',
      pattern: 'arcs',
      render: () => (
        <StatCard
          mood="celebrate"
          layout="chart"
          eyebrow="Who starts the day?"
          headline={<span className="stat-card__line">{asYou(stats.badges.mostReliableOpener)}</span>}
          sub={copy.opener}
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
          sub={copy.double}
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
        const youN = d ? (d.counts[you.id] ?? 0) : 0
        const themN = d ? (d.counts[them.id] ?? 0) : 0
        return (
          <StatCard
            mood="cheeky"
            layout="chart"
            eyebrow="Most one-sided day"
            headline={<span className="stat-card__mega">{d ? formatNumber(d.imbalance) : '0'}</span>}
            sub={copy.oneSided}
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
          sub={copy.voice}
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
          sub={copy.media}
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
          sub={copy.essay}
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
    ...(you.editedCount + them.editedCount > 0
      ? ([
          {
            id: 'edit-spiral',
            gradient: 'var(--grad-essay)',
            pattern: 'grid',
            render: () => (
              <div className="motif-wrap">
                <RewriteSpiral />
                <StatCard
                  mood="scroll"
                  layout="chart"
                  eyebrow="Edit spiral"
                  headline={
                    <>
                      <span className="stat-card__mega">
                        {formatNumber(you.editedCount + them.editedCount)}
                      </span>
                      <span className="stat-card__mega-label">rewrites</span>
                    </>
                  }
                  sub={copy.editSpiral}
                >
                  <HorizontalRankBars
                    items={[
                      {
                        label: 'You',
                        value: you.editedCount,
                        display: formatNumber(you.editedCount),
                      },
                      {
                        label: them.name,
                        value: them.editedCount,
                        display: formatNumber(them.editedCount),
                      },
                    ]}
                  />
                </StatCard>
              </div>
            ),
          },
        ] as StorySlide[])
      : []),
    ...(you.avgEditDelayMs != null || them.avgEditDelayMs != null
      ? ([
          {
            id: 'polish-vs-reply',
            gradient: 'var(--grad-read)',
            pattern: 'halftone',
            render: () => {
              const polish = you.avgEditDelayMs ?? them.avgEditDelayMs
              const reply = you.avgReplyMs ?? them.avgReplyMs
              return (
                <StatCard
                  mood="think"
                  layout="chart"
                  eyebrow="Polish vs reply"
                  headline={<span className="stat-card__line">Speed of second thoughts</span>}
                  sub={copy.polishVsReply}
                >
                  <HorizontalRankBars
                    items={[
                      {
                        label: 'Your polish',
                        value: polish ?? 0,
                        display: polish != null ? formatDuration(polish) : '—',
                      },
                      {
                        label: 'Your reply',
                        value: you.avgReplyMs ?? 0,
                        display:
                          you.avgReplyMs != null ? formatDuration(you.avgReplyMs) : '—',
                      },
                      ...(them.avgEditDelayMs != null
                        ? [
                            {
                              label: `${them.name} polish`,
                              value: them.avgEditDelayMs,
                              display: formatDuration(them.avgEditDelayMs),
                            },
                          ]
                        : []),
                      ...(reply != null && you.avgReplyMs == null
                        ? [
                            {
                              label: `${them.name} reply`,
                              value: them.avgReplyMs ?? 0,
                              display:
                                them.avgReplyMs != null
                                  ? formatDuration(them.avgReplyMs)
                                  : '—',
                            },
                          ]
                        : []),
                    ]}
                  />
                  <p className="chart-caption">
                    Exports have no read receipts — polish = send → edit delay
                  </p>
                </StatCard>
              )
            },
          },
        ] as StorySlide[])
      : []),
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
          sub={copy.chaos}
        >
          <HorizontalRankBars
            items={[
              {
                label: `! · ${asYou(bangKing.name)}`,
                value: bangKing.exclamationCount,
                display: formatNumber(bangKing.exclamationCount),
              },
              {
                label: `CAPS · ${asYou(capsKing.name)}`,
                value: capsKing.allCapsCount,
                display: formatNumber(capsKing.allCapsCount),
              },
            ]}
          />
        </StatCard>
      ),
    },
    ...(lex
      ? ([
          {
            id: 'lex',
            gradient: 'var(--grad-essay)',
            pattern: 'none',
            render: () => (
              <LexWordCard
                value={lex.value}
                count={lex.count}
                kind={lex.kind}
                sub={copy.lex}
              />
            ),
          },
        ] as StorySlide[])
      : []),
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
          sub={copy.emoji}
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
          sub={copy.comeback}
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
          headline={<span className="stat-card__line">{copy.badges}</span>}
        >
          <ul className="badge-grid">
            <li>
              <strong>Fastest replier</strong>
              <span>{asYou(stats.badges.fastestReplier)}</span>
            </li>
            <li>
              <strong>Night owl</strong>
              <span>{asYou(stats.badges.nightOwl)}</span>
            </li>
            <li>
              <strong>Essay writer</strong>
              <span>{asYou(stats.badges.essayWriter)}</span>
            </li>
            <li>
              <strong>Streak master</strong>
              <span>{asYou(stats.badges.streakMaster)}</span>
            </li>
            <li>
              <strong>Reliable opener</strong>
              <span>{asYou(stats.badges.mostReliableOpener)}</span>
            </li>
          </ul>
        </StatCard>
      ),
    },
    {
      id: 'summary',
      gradient: 'var(--grad-summary)',
      pattern: 'none',
      hold: true,
      render: () => <SummaryGrid stats={stats} />,
    },
  )

  return slides
}

function LexWordCard({
  value,
  count,
  kind,
  sub,
}: {
  value: string
  count: number
  kind: 'word' | 'phrase'
  sub: string
}) {
  const [shown, setShown] = useState(0)
  const row = useMemo(() => Array.from({ length: 12 }, () => value).join('   ·   '), [value])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const duration = Math.min(1600, 700 + count * 4)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(eased * count))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [count])

  return (
    <div className="lex-slide">
      <div className="lex-marquee" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`lex-marquee__row${i % 2 === 1 ? ' lex-marquee__row--rev' : ''}`}
            style={{ animationDuration: `${14 + i * 2.2}s` }}
          >
            <span>{row}</span>
            <span>{row}</span>
          </div>
        ))}
      </div>
      <StatCard
        mood="cheeky"
        layout="hero"
        eyebrow={kind === 'phrase' ? 'Catchphrase' : 'Most used word'}
        headline={<span className="stat-card__mega stat-card__mega--word">“{value}”</span>}
        sub={sub}
      >
        <p className="lex-times">
          <span className="lex-times__num">{formatNumber(shown)}</span>
          <span className="lex-times__label">times</span>
        </p>
      </StatCard>
    </div>
  )
}

function SummaryGrid({ stats }: { stats: WrappedStats }) {
  const ref = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState<'you' | 'them' | null>(null)
  const [view, setView] = useState<'you' | 'them'>('you')

  const viewStats = view === 'you' ? stats : flipPerspective(stats)
  const viewerLabel = view === 'you' ? 'You' : stats.them.name

  const cells = useMemo(() => {
    const base = [
      { label: 'Messages', value: formatNumber(viewStats.totalMessages) },
      {
        label: 'Avg reply',
        value: viewStats.you.avgReplyMs != null ? formatDuration(viewStats.you.avgReplyMs) : '—',
      },
      { label: 'Night owl %', value: formatPct(viewStats.you.lateNightPct) },
      { label: 'Day streak', value: String(viewStats.longestDailyStreak) },
      {
        label: 'Prime time',
        value: `${viewStats.primeDayName.slice(0, 3)} ${formatHour(viewStats.primeHour)}`,
      },
      { label: 'Top emoji', value: viewStats.topEmoji ?? '✈️' },
    ]
    if (viewStats.topWord) {
      base[5] = { label: 'Top word', value: viewStats.topWord.value }
    }
    return base
  }, [viewStats])

  async function exportImage(whoCard: 'you' | 'them') {
    const prev = view
    setSaving(whoCard)
    if (whoCard !== view) {
      flushSync(() => setView(whoCard))
    }
    try {
      if (!ref.current) return
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0410',
      })
      const a = document.createElement('a')
      a.href = dataUrl
      const whoSlug = whoCard === 'you' ? 'you' : stats.them.name.replace(/\s+/g, '-').toLowerCase()
      a.download = `telegram-wrapped-${stats.chatName.replace(/\s+/g, '-').toLowerCase()}-${whoSlug}.png`
      a.click()
    } catch {
      // ignore — user can screenshot
    } finally {
      setSaving(null)
      if (whoCard !== prev) setView(prev)
    }
  }

  return (
    <div className="summary-wrap">
      <div className="summary-toggle" role="tablist" aria-label="Whose card">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'you'}
          className={`summary-toggle__btn${view === 'you' ? ' summary-toggle__btn--on' : ''}`}
          onClick={() => setView('you')}
        >
          Your card
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'them'}
          className={`summary-toggle__btn${view === 'them' ? ' summary-toggle__btn--on' : ''}`}
          onClick={() => setView('them')}
        >
          {stats.them.name}&apos;s card
        </button>
      </div>

      <div className="summary-grid" ref={ref}>
        <header className="summary-grid__header">
          <p>Telegram Wrapped · {viewerLabel}</p>
          <h2>{viewStats.chatName}</h2>
          <span>
            {viewStats.year ?? 'All time'} · {formatNumber(viewStats.totalMessages)} messages
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
            {who(viewStats.you.name, viewStats.badges.fastestReplier)} · fastest ·{' '}
            {who(viewStats.you.name, viewStats.badges.nightOwl)} · night owl
          </span>
        </footer>
      </div>

      <div className="summary-actions">
        <button
          type="button"
          className="btn btn--export"
          onClick={() => exportImage('you')}
          disabled={saving != null}
        >
          {saving === 'you' ? 'Saving…' : 'Download your card'}
        </button>
        <button
          type="button"
          className="btn btn--export btn--export-secondary"
          onClick={() => exportImage('them')}
          disabled={saving != null}
        >
          {saving === 'them' ? 'Saving…' : `Download ${stats.them.name}'s card`}
        </button>
      </div>
    </div>
  )
}
