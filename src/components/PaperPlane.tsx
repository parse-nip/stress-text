import type { CSSProperties } from 'react'

type Mood = 'idle' | 'race' | 'sleepy' | 'fire' | 'scroll' | 'cheeky' | 'emoji' | 'celebrate' | 'think'

const moodClass: Record<Mood, string> = {
  idle: 'plane--idle',
  race: 'plane--race',
  sleepy: 'plane--sleepy',
  fire: 'plane--fire',
  scroll: 'plane--scroll',
  cheeky: 'plane--cheeky',
  emoji: 'plane--emoji',
  celebrate: 'plane--celebrate',
  think: 'plane--think',
}

interface PaperPlaneProps {
  mood?: Mood
  size?: number
  className?: string
  style?: CSSProperties
}

/** Recurring Telegram paper-plane mascot — reacts to each Wrapped card. */
export function PaperPlane({ mood = 'idle', size = 72, className = '', style }: PaperPlaneProps) {
  return (
    <div
      className={`paper-plane ${moodClass[mood]} ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden
    >
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="plane-body"
          d="M12 38 L68 18 L52 62 L40 46 L12 38Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path className="plane-fold" d="M40 46 L68 18 L48 44 Z" fill="currentColor" opacity="0.45" />
        <path
          className="plane-trail"
          d="M10 42 C4 44 2 50 6 54"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />
      </svg>
    </div>
  )
}

interface TwinPlanesProps {
  youFaster: boolean
}

export function RacingPlanes({ youFaster }: TwinPlanesProps) {
  return (
    <div className="racing-planes" aria-hidden>
      <div className={`racer ${youFaster ? 'racer--lead' : 'racer--lag'}`}>
        <PaperPlane mood="race" size={48} />
        <span>you</span>
      </div>
      <div className={`racer ${youFaster ? 'racer--lag' : 'racer--lead'}`}>
        <PaperPlane mood="race" size={48} />
        <span>them</span>
      </div>
    </div>
  )
}
