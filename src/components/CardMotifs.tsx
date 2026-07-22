/** Decorative per-card motion motifs — unique vibes, no icon libraries. */

export function PulseRings() {
  return (
    <div className="motif motif--rings" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  )
}

export function SpeedDashes() {
  return (
    <div className="motif motif--dashes" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

export function StarField() {
  return (
    <div className="motif motif--stars" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            animationDelay: `${(i % 7) * 0.35}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }}
        />
      ))}
    </div>
  )
}

export function FlameStrip() {
  return (
    <div className="motif motif--flames" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}

/** Analog-ish clock with hand aimed at the peak hour. */
export function PeakHourClock({ hour }: { hour: number }) {
  // Map 0–23 onto a 12-hour face (0 and 12 share the top)
  const faceHour = hour % 12
  const deg = faceHour * 30 // 360/12
  return (
    <div className="peak-clock" aria-hidden>
      <div className="peak-clock__face">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={`peak-clock__tick${i === faceHour ? ' peak-clock__tick--hot' : ''}`}
            style={{ transform: `rotate(${i * 30}deg) translateY(-42%)` }}
          />
        ))}
        <div className="peak-clock__hand-wrap" style={{ transform: `rotate(${deg}deg)` }}>
          <div className="peak-clock__hand" />
        </div>
        <div className="peak-clock__hub" />
      </div>
      <p className="peak-clock__ampm">{hour < 12 ? 'AM' : 'PM'}</p>
    </div>
  )
}

/** Cascading laugh tokens for the funniest-hour card. */
export function LaughCascade({ samples }: { samples?: string[] }) {
  const words = samples && samples.length > 0 ? samples : ['haha', 'lol', 'hahaha', 'lmao', 'hehe']
  return (
    <div className="laugh-cascade" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <span
          key={i}
          className="laugh-cascade__chip"
          style={{
            left: `${(i * 19 + 7) % 92}%`,
            animationDelay: `${(i % 8) * 0.35}s`,
            animationDuration: `${5.5 + (i % 5) * 0.7}s`,
            fontSize: `${0.85 + (i % 4) * 0.2}rem`,
          }}
        >
          {words[i % words.length]}
        </span>
      ))}
    </div>
  )
}

export function GapPulse() {
  return (
    <div className="motif motif--gap" aria-hidden>
      <span className="motif-gap__a" />
      <span className="motif-gap__line" />
      <span className="motif-gap__b" />
    </div>
  )
}
