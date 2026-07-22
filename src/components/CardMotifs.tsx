/** Decorative motion motifs kept for night-owl + funniest-hour cards. */

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
