import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ProgressDots } from './ProgressDots'
import type { StorySlide } from './cards'

const AUTO_MS = 6500

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

  const go = useCallback(
    (next: number) => {
      if (next < 0) {
        setIndex(0)
        accruedRef.current = 0
        setProgress(0)
        return
      }
      if (next >= slides.length) {
        onExit()
        return
      }
      setIndex(next)
      accruedRef.current = 0
      setProgress(0)
      startRef.current = performance.now()
    },
    [onExit, slides.length],
  )

  useEffect(() => {
    if (paused) return

    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = accruedRef.current + (now - startRef.current)
      const p = Math.min(1, elapsed / AUTO_MS)
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
      accruedRef.current = Math.min(AUTO_MS, accruedRef.current + (now - startRef.current))
    }
  }, [index, paused, go])

  function onPointerDown() {
    setPaused(true)
  }

  function onPointerUp(e: ReactPointerEvent) {
    setPaused(false)
    const x = e.clientX
    const w = window.innerWidth
    if (x < w * 0.33) go(index - 1)
    else go(index + 1)
  }

  const slide = slides[index]
  if (!slide) return null

  return (
    <div
      className="story"
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
          onPointerUp={() => {
            setPaused(false)
            go(index - 1)
          }}
        />
        <button
          type="button"
          className="story__zone story__zone--right"
          aria-label="Next"
          onPointerDown={onPointerDown}
          onPointerUp={(e: ReactPointerEvent) => onPointerUp(e)}
        />
        <div className="story__body">{slide.render()}</div>
      </div>

      <p className="story__hint">Tap left / right · hold to pause</p>
    </div>
  )
}
