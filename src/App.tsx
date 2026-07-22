import { useMemo, useState } from 'react'
import { UploadScreen } from './components/UploadScreen'
import { StoryPlayer } from './components/StoryPlayer'
import { buildSlides } from './components/cards'
import { parseExport, detectParticipants } from './lib/parseTelegram'
import { computeWrappedStats, finalizeBadges } from './lib/computeStats'
import { buildDemoExport } from './lib/demoExport'
import type { ParsedMessage, WrappedStats } from './types/telegram'
import './App.css'

type Phase = 'upload' | 'pick' | 'year' | 'story'

export default function App() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [chatName, setChatName] = useState('')
  const [messages, setMessages] = useState<ParsedMessage[]>([])
  const [participants, setParticipants] = useState<{ id: string; name: string; count: number }[]>([])
  const [youId, setYouId] = useState<string | null>(null)
  const [years, setYears] = useState<number[]>([])
  const [stats, setStats] = useState<WrappedStats | null>(null)

  function reset() {
    setPhase('upload')
    setError(null)
    setLoading(false)
    setChatName('')
    setMessages([])
    setParticipants([])
    setYouId(null)
    setYears([])
    setStats(null)
  }

  function ingest(data: unknown) {
    const { exportMeta, messages: parsed } = parseExport(data)
    const people = detectParticipants(parsed)
    if (people.length < 2) {
      throw new Error('Need at least two people in the chat to wrap.')
    }
    const yearSet = [...new Set(parsed.map((m) => m.date.getFullYear()))].sort((a, b) => b - a)
    setChatName(exportMeta.name)
    setMessages(parsed)
    setParticipants(people.slice(0, 8))
    setYears(yearSet)
    setPhase('pick')
  }

  async function onFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      ingest(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    } finally {
      setLoading(false)
    }
  }

  function onDemo() {
    setLoading(true)
    setError(null)
    try {
      ingest(buildDemoExport())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demo failed.')
    } finally {
      setLoading(false)
    }
  }

  function confirmYou(id: string) {
    setYouId(id)
    setPhase('year')
  }

  function startWrapped(selectedYear: number | null) {
    if (!youId) return
    try {
      const raw = computeWrappedStats(messages, youId, chatName, selectedYear)
      const final = finalizeBadges(raw)
      setStats(final)
      setPhase('story')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not compute stats.')
      setPhase('upload')
    }
  }

  const slides = useMemo(() => (stats ? buildSlides(stats) : []), [stats])

  if (phase === 'story' && stats && slides.length) {
    return <StoryPlayer slides={slides} onExit={reset} />
  }

  if (phase === 'pick') {
    return (
      <div className="setup">
        <div className="setup__card">
          <h2>Who are you?</h2>
          <p>We found these voices in <strong>{chatName}</strong>.</p>
          <div className="setup__choices">
            {participants.map((p) => (
              <button key={p.id} type="button" className="btn btn--choice" onClick={() => confirmYou(p.id)}>
                <span>{p.name}</span>
                <small>{p.count.toLocaleString()} messages</small>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'year') {
    return (
      <div className="setup">
        <div className="setup__card">
          <h2>Pick your window</h2>
          <p>Spotify has a year. You have a chat timeline.</p>
          <div className="setup__choices">
            <button type="button" className="btn btn--choice" onClick={() => startWrapped(null)}>
              <span>All time</span>
              <small>Everything in the export</small>
            </button>
            {years.map((y) => (
              <button key={y} type="button" className="btn btn--choice" onClick={() => startWrapped(y)}>
                <span>{y}</span>
                <small>Just that year</small>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--ghost" onClick={() => setPhase('pick')}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return <UploadScreen onFile={onFile} onDemo={onDemo} error={error} loading={loading} />
}
