import type { ReactNode } from 'react'
import { PaperPlane } from './PaperPlane'

type Mood = 'idle' | 'race' | 'sleepy' | 'fire' | 'scroll' | 'cheeky' | 'emoji' | 'celebrate' | 'think'

interface StatCardProps {
  eyebrow?: string
  headline: ReactNode
  sub?: ReactNode
  mood?: Mood
  accent?: string
  children?: ReactNode
  className?: string
}

/** One big number / idea per card — Spotify Wrapped energy. */
export function StatCard({
  eyebrow,
  headline,
  sub,
  mood = 'idle',
  accent,
  children,
  className = '',
}: StatCardProps) {
  return (
    <article className={`stat-card ${className}`} style={accent ? ({ ['--card-accent' as string]: accent } as object) : undefined}>
      <div className="stat-card__mascot">
        <PaperPlane mood={mood} size={64} />
      </div>
      {eyebrow ? <p className="stat-card__eyebrow">{eyebrow}</p> : null}
      <div className="stat-card__headline">{headline}</div>
      {sub ? <p className="stat-card__sub">{sub}</p> : null}
      {children}
    </article>
  )
}
