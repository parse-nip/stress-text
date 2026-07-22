import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { PaperPlane } from './PaperPlane'

interface UploadScreenProps {
  onFile: (file: File) => void
  onDemo: () => void
  error: string | null
  loading: boolean
}

export function UploadScreen({ onFile, onDemo, error, loading }: UploadScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function takeFile(file: File | undefined | null) {
    if (!file) return
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      // still allow — Telegram sometimes omits mime
    }
    onFile(file)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    takeFile(e.target.files?.[0])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    takeFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="landing">
      <div className="landing__glow" aria-hidden />
      <header className="landing__brand">
        <PaperPlane mood="celebrate" size={88} />
        <h1>Telegram Wrapped</h1>
        <p className="landing__tagline">
          Your chat, remixed as a year-in-review. Content-blind. Pure timing chaos.
        </p>
      </header>

      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''} ${loading ? 'dropzone--loading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onChange}
        />
        <p className="dropzone__title">{loading ? 'Crunching the vibes…' : 'Drop your export JSON'}</p>
        <p className="dropzone__hint">
          Telegram Desktop → chat → ⋮ → Export chat history → <strong>Machine-readable JSON</strong>
          . Photos optional. Everything stays in your browser.
        </p>
      </div>

      {error ? <p className="landing__error">{error}</p> : null}

      <button type="button" className="btn btn--ghost" onClick={onDemo} disabled={loading}>
        Try a demo chat
      </button>

      <details className="landing__howto">
        <summary>How to export</summary>
        <ol>
          <li>Open Telegram Desktop (mobile exports differ).</li>
          <li>Open the chat → menu → Export chat history.</li>
          <li>Format: <strong>JSON</strong>. Uncheck media if you only want timing stats.</li>
          <li>Drop the resulting <code>result.json</code> here.</li>
        </ol>
      </details>
    </div>
  )
}
