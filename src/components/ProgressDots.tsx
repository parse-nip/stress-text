interface ProgressDotsProps {
  total: number
  current: number
  /** 0–1 progress within current card (for story-style fill) */
  progress: number
}

export function ProgressDots({ total, current, progress }: ProgressDotsProps) {
  return (
    <div className="progress-dots" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        let fill = 0
        if (i < current) fill = 1
        else if (i === current) fill = progress
        return (
          <div key={i} className="progress-dot">
            <div className="progress-dot__fill" style={{ transform: `scaleX(${fill})` }} />
          </div>
        )
      })}
    </div>
  )
}
