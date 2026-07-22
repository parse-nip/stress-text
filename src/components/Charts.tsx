/** Lightweight SVG/CSS charts for story cards — no chart library. */

interface BarItem {
  label: string
  value: number
  highlight?: boolean
}

export function VerticalBars({
  items,
  maxBars = 24,
  className = '',
}: {
  items: BarItem[]
  maxBars?: number
  className?: string
}) {
  const slice = items.slice(0, maxBars)
  const max = Math.max(...slice.map((i) => i.value), 1)
  return (
    <div className={`chart-vbars ${className}`} role="img" aria-label="Bar chart">
      {slice.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className={`chart-vbars__col${item.highlight ? ' chart-vbars__col--hot' : ''}`}
        >
          <div className="chart-vbars__track">
            <div
              className="chart-vbars__bar"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="chart-vbars__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function HorizontalRankBars({
  items,
  className = '',
}: {
  items: Array<{ label: string; value: number; display?: string }>
  className?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className={`chart-hbars ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="chart-hbars__row">
          <div className="chart-hbars__meta">
            <span className="chart-hbars__name">{item.label}</span>
            <span className="chart-hbars__val">{item.display ?? item.value}</span>
          </div>
          <div className="chart-hbars__track">
            <div
              className="chart-hbars__fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Bold you-vs-them towers (replaces the muddy donut for volume). */
export function DuelTowers({
  a,
  b,
  aLabel = 'You',
  bLabel,
  aDisplay,
  bDisplay,
  className = '',
}: {
  a: number
  b: number
  aLabel?: string
  bLabel: string
  aDisplay?: string
  bDisplay?: string
  className?: string
}) {
  const max = Math.max(a, b, 1)
  const aLead = a >= b
  return (
    <div className={`chart-duel ${className}`} role="img" aria-label={`${aLabel} vs ${bLabel}`}>
      <div className={`chart-duel__col${aLead ? ' chart-duel__col--lead' : ''}`}>
        <span className="chart-duel__val">{aDisplay ?? a.toLocaleString()}</span>
        <div className="chart-duel__tower-wrap">
          <div className="chart-duel__tower chart-duel__tower--a" style={{ height: `${(a / max) * 100}%` }} />
        </div>
        <span className="chart-duel__name">{aLabel}</span>
      </div>
      <div className="chart-duel__vs" aria-hidden>
        vs
      </div>
      <div className={`chart-duel__col${!aLead ? ' chart-duel__col--lead' : ''}`}>
        <span className="chart-duel__val">{bDisplay ?? b.toLocaleString()}</span>
        <div className="chart-duel__tower-wrap">
          <div className="chart-duel__tower chart-duel__tower--b" style={{ height: `${(b / max) * 100}%` }} />
        </div>
        <span className="chart-duel__name">{bLabel}</span>
      </div>
    </div>
  )
}

/** Seesaw / balance for one-sided days. */
export function BalanceTilt({
  left,
  right,
  leftLabel = 'You',
  rightLabel,
  className = '',
}: {
  left: number
  right: number
  leftLabel?: string
  rightLabel: string
  className?: string
}) {
  const total = Math.max(left + right, 1)
  // tilt degrees: -18 … +18
  const tilt = ((right - left) / total) * 18
  return (
    <div className={`chart-balance ${className}`} role="img" aria-label="Message balance">
      <div className="chart-balance__fulcrum" aria-hidden />
      <div className="chart-balance__beam" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="chart-balance__pan chart-balance__pan--l">
          <strong>{left}</strong>
          <span>{leftLabel}</span>
        </div>
        <div className="chart-balance__pan chart-balance__pan--r">
          <strong>{right}</strong>
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  )
}

/** Expanding bubble trail for double-text streaks. */
export function BubbleTrail({
  count,
  className = '',
}: {
  count: number
  className?: string
}) {
  const n = Math.min(Math.max(count, 1), 8)
  return (
    <div className={`chart-bubbles ${className}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="chart-bubbles__dot"
          style={{
            width: `${1.1 + i * 0.35}rem`,
            height: `${1.1 + i * 0.35}rem`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Thermometer for essay / word length. */
export function ThermoBar({
  value,
  max = 200,
  label,
  className = '',
}: {
  value: number
  max?: number
  label?: string
  className?: string
}) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100)
  return (
    <div className={`chart-thermo ${className}`} role="img" aria-label={label ?? `${value} words`}>
      <div className="chart-thermo__tube">
        <div className="chart-thermo__fill" style={{ height: `${pct}%` }} />
        <div className="chart-thermo__bulb" />
      </div>
      {label ? <p className="chart-thermo__label">{label}</p> : null}
    </div>
  )
}

/** Twin arc clocks — polish vs reply timing. */
export function TwinArcs({
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  leftDisplay,
  rightDisplay,
  className = '',
}: {
  leftValue: number
  rightValue: number
  leftLabel: string
  rightLabel: string
  leftDisplay: string
  rightDisplay: string
  className?: string
}) {
  const max = Math.max(leftValue, rightValue, 1)
  const leftPct = leftValue / max
  const rightPct = rightValue / max
  const r = 36
  const c = Math.PI * r
  return (
    <div className={`chart-twins ${className}`}>
      <div className="chart-twins__item">
        <svg viewBox="0 0 100 60" className="chart-twins__svg">
          <path
            className="chart-twins__track"
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            className="chart-twins__fill chart-twins__fill--a"
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${leftPct * c} ${c}`}
          />
          <text x="50" y="46" textAnchor="middle" className="chart-twins__num">
            {leftDisplay}
          </text>
        </svg>
        <span>{leftLabel}</span>
      </div>
      <div className="chart-twins__item">
        <svg viewBox="0 0 100 60" className="chart-twins__svg">
          <path
            className="chart-twins__track"
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            className="chart-twins__fill chart-twins__fill--b"
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${rightPct * c} ${c}`}
          />
          <text x="50" y="46" textAnchor="middle" className="chart-twins__num">
            {rightDisplay}
          </text>
        </svg>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

/** Big glyph tiles for chaos punctuation. */
export function GlyphTiles({
  items,
  className = '',
}: {
  items: Array<{ glyph: string; label: string; value: string }>
  className?: string
}) {
  return (
    <div className={`chart-glyphs ${className}`}>
      {items.map((item) => (
        <div key={item.glyph + item.label} className="chart-glyphs__tile">
          <span className="chart-glyphs__glyph">{item.glyph}</span>
          <span className="chart-glyphs__val">{item.value}</span>
          <span className="chart-glyphs__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Arc gauge 0–100 for night-owl %. */
export function ArcGauge({
  value,
  label,
  className = '',
}: {
  value: number
  label?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, value)) / 100
  const r = 54
  const c = Math.PI * r // semicircle
  const filled = pct * c

  return (
    <div className={`chart-gauge ${className}`} role="img" aria-label={label ?? `${Math.round(value)}%`}>
      <svg viewBox="0 0 140 90" className="chart-gauge__svg">
        <path
          className="chart-gauge__track"
          d="M 16 78 A 54 54 0 0 1 124 78"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          className="chart-gauge__fill"
          d="M 16 78 A 54 54 0 0 1 124 78"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`}
        />
        <text x="70" y="68" textAnchor="middle" className="chart-gauge__num">
          {Math.round(value)}%
        </text>
      </svg>
      {label ? <p className="chart-gauge__label">{label}</p> : null}
    </div>
  )
}

/** Stylized audio waveform for voice notes. */
export function Waveform({
  bars = 28,
  peak = 0.85,
  className = '',
}: {
  bars?: number
  peak?: number
  className?: string
}) {
  // Deterministic heights so SSR/CSR match and animation feels intentional
  const heights = Array.from({ length: bars }, (_, i) => {
    const t = i / bars
    const wave = Math.sin(t * Math.PI * 3.2) * 0.35 + Math.sin(t * Math.PI * 7.1) * 0.2
    const mid = 0.35 + Math.abs(wave)
    const tip = i > bars * 0.35 && i < bars * 0.55 ? peak : mid
    return Math.min(1, Math.max(0.12, tip))
  })

  return (
    <div className={`chart-wave ${className}`} aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="chart-wave__bar"
          style={{
            height: `${h * 100}%`,
            animationDelay: `${(i % 8) * 0.08}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Row of filled dots representing a streak length (capped visually). */
export function StreakDots({
  count,
  maxShow = 14,
  className = '',
}: {
  count: number
  maxShow?: number
  className?: string
}) {
  const shown = Math.min(count, maxShow)
  const overflow = count > maxShow
  return (
    <div className={`chart-streak ${className}`} aria-hidden>
      {Array.from({ length: shown }, (_, i) => (
        <span
          key={i}
          className="chart-streak__dot"
          style={{ animationDelay: `${i * 0.04}s` }}
        />
      ))}
      {overflow ? <span className="chart-streak__more">+{count - maxShow}</span> : null}
    </div>
  )
}

/** Dual meter for reply speed — shorter bar = faster. */
export function SpeedMeters({
  youMs,
  themMs,
  themName,
  className = '',
}: {
  youMs: number | null
  themMs: number | null
  themName: string
  className?: string
}) {
  const you = youMs ?? 0
  const them = themMs ?? 0
  const max = Math.max(you, them, 1)
  // Invert: faster (smaller ms) → longer “speed” bar
  const youSpeed = youMs == null ? 0 : 1 - you / max
  const themSpeed = themMs == null ? 0 : 1 - them / max
  const floor = 0.12

  return (
    <div className={`chart-speed ${className}`}>
      <div className="chart-speed__row">
        <span>You</span>
        <div className="chart-speed__track">
          <div
            className="chart-speed__fill chart-speed__fill--you"
            style={{ width: `${Math.max(floor, youSpeed) * 100}%` }}
          />
        </div>
      </div>
      <div className="chart-speed__row">
        <span>{themName}</span>
        <div className="chart-speed__track">
          <div
            className="chart-speed__fill chart-speed__fill--them"
            style={{ width: `${Math.max(floor, themSpeed) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/** Stacked media split (photos vs videos). */
export function MediaStack({
  photos,
  videos,
  className = '',
}: {
  photos: number
  videos: number
  className?: string
}) {
  const total = Math.max(photos + videos, 1)
  return (
    <div className={`chart-media ${className}`}>
      <div className="chart-media__stack" aria-hidden>
        <div className="chart-media__seg chart-media__seg--photo" style={{ flex: photos || 0.01 }} />
        <div className="chart-media__seg chart-media__seg--video" style={{ flex: videos || 0.01 }} />
      </div>
      <div className="chart-media__legend">
        <span>
          <i className="swatch swatch--photo" /> Photos {photos}
        </span>
        <span>
          <i className="swatch swatch--video" /> Videos {videos}
        </span>
        <span className="chart-media__total">{Math.round((photos / total) * 100)}% photos</span>
      </div>
    </div>
  )
}

/** SVG area/line sparkline for monthly activity. */
export function MonthSparkline({
  values,
  labels,
  className = '',
}: {
  values: number[]
  labels: string[]
  className?: string
}) {
  const w = 320
  const h = 120
  const padX = 8
  const padY = 12
  const max = Math.max(...values, 1)
  const n = Math.max(values.length, 1)

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(n - 1, 1)) * (w - padX * 2)
    const y = h - padY - (v / max) * (h - padY * 2)
    return { x, y, v, label: labels[i] ?? '' }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L ${points[points.length - 1]?.x.toFixed(1) ?? padX} ${(h - padY).toFixed(1)} L ${padX} ${(h - padY).toFixed(1)} Z`
  const peak = points.reduce((a, b) => (b.v > a.v ? b : a), points[0] ?? { x: 0, y: 0, v: 0, label: '' })

  const tickIdx =
    n <= 6
      ? points.map((_, i) => i)
      : [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <div className={`chart-spark ${className}`}>
      <svg viewBox={`0 0 ${w} ${h}`} className="chart-spark__svg" role="img" aria-label="Messages by month">
        <path className="chart-spark__area" d={area} />
        <path className="chart-spark__line" d={line} fill="none" />
        {peak ? (
          <circle className="chart-spark__peak" cx={peak.x} cy={peak.y} r="5" />
        ) : null}
      </svg>
      <div className="chart-spark__ticks">
        {tickIdx.map((i) => (
          <span key={`tick-${i}`}>{labels[i]}</span>
        ))}
      </div>
    </div>
  )
}

/** Side-by-side year volume compare. */
export function YearCompareBars({
  priorYear,
  recentYear,
  priorCount,
  recentCount,
  className = '',
}: {
  priorYear: number
  recentYear: number
  priorCount: number
  recentCount: number
  className?: string
}) {
  const max = Math.max(priorCount, recentCount, 1)
  return (
    <div className={`chart-years ${className}`} role="img" aria-label="Year comparison">
      <div className="chart-years__col">
        <div className="chart-years__bar-wrap">
          <div
            className="chart-years__bar chart-years__bar--prior"
            style={{ height: `${(priorCount / max) * 100}%` }}
          />
        </div>
        <span className="chart-years__year">{priorYear}</span>
        <span className="chart-years__count">{priorCount.toLocaleString()}</span>
      </div>
      <div className="chart-years__col">
        <div className="chart-years__bar-wrap">
          <div
            className="chart-years__bar chart-years__bar--recent"
            style={{ height: `${(recentCount / max) * 100}%` }}
          />
        </div>
        <span className="chart-years__year">{recentYear}</span>
        <span className="chart-years__count">{recentCount.toLocaleString()}</span>
      </div>
    </div>
  )
}
