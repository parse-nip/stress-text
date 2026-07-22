import type { ReactNode } from 'react'
import { PaperPlane } from './PaperPlane'

type Mood = 'idle' | 'race' | 'sleepy' | 'fire' | 'scroll' | 'cheeky' | 'emoji' | 'celebrate' | 'think'
type Layout = 'hero' | 'chart'

interface StatCardProps {
  eyebrow?: string
  headline: ReactNode
  sub?: ReactNode
  mood?: Mood
  layout?: Layout
  accent?: string
  children?: ReactNode
  className?: string
}

/** One big idea per card — hero (mega number) or chart-forward layout. */
export function StatCard({
  eyebrow,
  headline,
  sub,
  mood = 'idle',
  layout = 'hero',
  accent,
  children,
  className = '',
}: StatCardProps) {
  return (
    <article
      className={`stat-card stat-card--${layout} ${className}`}
      style={accent ? ({ ['--card-accent' as string]: accent } as object) : undefined}
    >
      <div className="stat-card__mascot">
        <PaperPlane mood={mood} size={layout === 'chart' ? 48 : 64} />
      </div>
      {eyebrow ? <p className="stat-card__eyebrow">{eyebrow}</p> : null}
      <div className="stat-card__headline">{headline}</div>
      {sub ? <p className="stat-card__sub">{sub}</p> : null}
      {children ? <div className="stat-card__viz">{children}</div> : null}
    </article>
  )
}
