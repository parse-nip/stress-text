import { useCallback, useEffect, useRef, useState } from 'react'
import { ProgressDots } from './ProgressDots'
import type { StorySlide } from './cards'

/** Default beat — long enough to read a caption + glance at a chart. */
const AUTO_MS = 8500
/** Press longer than this = pause only; shorter = tap to skip. */
const HOLD_PAUSE_MS = 220

interface StoryPlayerProps {
  slides: StorySlide[]
  onExit: () => void
}

export function StoryPlayer({ slides, onExit }: StoryPlayerProps) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const accruedRef = useRef(0)
  const pointerDownAt = useRef(0)

  const slide = slides[index]
  const hold = Boolean(slide?.hold)
  const durationMs = slide?.durationMs ?? AUTO_MS

  const go = useCallback(
    (next: number) => {
      if (next < 0) {
        setIndex(0)
        accruedRef.current = 0
        setProgress(0)
        return
      }
      if (next >= slides.length) {
        // Final download slide: stay put (no timer / no accidental exit via tap-right)
        if (slides[index]?.hold) return
        onExit()
        return
      }
      setIndex(next)
      accruedRef.current = 0
      setProgress(0)
      startRef.current = performance.now()
    },
    [onExit, slides, index],
  )

  useEffect(() => {
    if (hold) {
      setProgress(1)
      accruedRef.current = durationMs
      return
    }
    if (paused) return

    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = accruedRef.current + (now - startRef.current)
      const p = Math.min(1, elapsed / durationMs)
      setProgress(p)
      if (p >= 1) {
        accruedRef.current = 0
        go(index + 1)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const now = performance.now()
      accruedRef.current = Math.min(durationMs, accruedRef.current + (now - startRef.current))
    }
  }, [index, paused, hold, go, durationMs])

  function onPointerDown() {
    if (hold) return
    pointerDownAt.current = performance.now()
    setPaused(true)
  }

  /** True when the user held long enough that this should not count as a tap. */
  function wasPauseHold() {
    return performance.now() - pointerDownAt.current >= HOLD_PAUSE_MS
  }

  function onZoneUp(direction: -1 | 1) {
    if (hold) {
      if (direction === -1) go(index - 1)
      return
    }
    setPaused(false)
    // Hold-to-pause: resume in place. Tap: skip.
    if (wasPauseHold()) return
    go(index + direction)
  }

  if (!slide) return null

  return (
    <div
      className={`story story--pattern-${slide.pattern}${hold ? ' story--hold' : ''}`}
      style={{ background: slide.gradient }}
      onPointerLeave={() => setPaused(false)}
      role="presentation"
    >
      <div className="story__chrome">
        <ProgressDots total={slides.length} current={index} progress={progress} />
        <button
          type="button"
          className="story__close"
          onClick={(e) => {
            e.stopPropagation()
            onExit()
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="story__stage" key={slide.id}>
        {/* Full-screen tap zones sit behind the card so buttons stay clickable */}
        <button
          type="button"
          className="story__zone story__zone--left"
          aria-label="Previous"
          onPointerDown={onPointerDown}
          onPointerUp={() => onZoneUp(-1)}
        />
        {!hold ? (
          <button
            type="button"
            className="story__zone story__zone--right"
            aria-label="Next"
            onPointerDown={onPointerDown}
            onPointerUp={() => onZoneUp(1)}
          />
        ) : null}
        <div className="story__body">{slide.render()}</div>
      </div>

      <p className="story__hint">
        {hold
          ? 'Download your cards · tap left to go back · × to close'
          : 'Tap to skip · hold to pause'}
      </p>
    </div>
  )
}
