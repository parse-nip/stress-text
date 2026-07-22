/** Laugh / giggle detectors for the “funniest hour” card. */

/** Matches ha(ha)+, he(he)+, lol+, lmao+, rofl, and common laugh emoji. */
export const LAUGH_RE =
  /(?:\b(?:ha){2,}h?\b|\b(?:he){2,}h?\b|\blol+\b|\blmao+\b|\brofl\b|😂|🤣|💀)/gi

export function countLaughs(text: string): number {
  if (!text) return 0
  const matches = text.match(LAUGH_RE)
  return matches?.length ?? 0
}

/** Pick a short display sample from a laugh match for cascade chips. */
export function laughSamples(text: string, limit = 5): string[] {
  const out: string[] = []
  const re = new RegExp(LAUGH_RE.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) != null && out.length < limit) {
    const t = m[0]
    if (!out.includes(t)) out.push(t.length > 10 ? `${t.slice(0, 8)}…` : t)
  }
  return out
}
