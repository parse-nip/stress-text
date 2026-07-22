export function formatDuration(ms: number): string {
  if (ms < 0 || Number.isNaN(ms)) return '—'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  const hr = Math.round(min / 60)
  if (hr < 48) return `${hr} hr`
  const days = Math.round(hr / 24)
  if (days < 60) return `${days} days`
  const months = Math.round(days / 30)
  if (months < 24) return `${months} months`
  const years = (days / 365).toFixed(1)
  return `${years} years`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

export function formatHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour} ${period}`
}

export function formatPct(n: number): string {
  return `${Math.round(n)}%`
}

export function formatVoice(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function possessive(name: string): string {
  if (!name) return ''
  return name.endsWith('s') ? `${name}'` : `${name}'s`
}
