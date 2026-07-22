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

/** Two-slice donut (you vs them). */
export function SplitDonut({
  a,
  b,
  aLabel,
  bLabel,
  size = 180,
  className = '',
}: {
  a: number
  b: number
  aLabel: string
  bLabel: string
  size?: number
  className?: string
}) {
  const total = Math.max(a + b, 1)
  const aPct = a / total
  const r = 42
  const c = 2 * Math.PI * r
  const aLen = aPct * c
  const bLen = c - aLen

  return (
    <div className={`chart-donut ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <circle
          className="chart-donut__ring chart-donut__ring--b"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeDasharray={`${bLen} ${c}`}
          strokeDashoffset={-aLen}
          transform="rotate(-90 50 50)"
        />
        <circle
          className="chart-donut__ring chart-donut__ring--a"
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="14"
          strokeDasharray={`${aLen} ${c}`}
          strokeDashoffset={0}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="48" textAnchor="middle" className="chart-donut__pct">
          {Math.round(aPct * 100)}%
        </text>
        <text x="50" y="58" textAnchor="middle" className="chart-donut__pct-sub">
          you
        </text>
      </svg>
      <div className="chart-donut__legend">
        <span>
          <i className="swatch swatch--a" /> {aLabel}
        </span>
        <span>
          <i className="swatch swatch--b" /> {bLabel}
        </span>
      </div>
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
