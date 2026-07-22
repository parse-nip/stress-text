/** Light lexical stats — intentional exception to content-blindness (client-only). */

const STOP = new Set(
  `
  a about after again all also am an and another any are as at back be because been
  before being but by can come could day did do does doing don down even ever every
  for from get got had has have having he her here hers him his how i if in into is
  it its just know like lol lmao haha hahaha honestly literally look made make me
  might more most much my no not now of oh ok okay on one only or our out over own
  really right said same see she should so some still such than that the their them
  then there these they thing this those through to too u uh um up us very was we
  well were what when where which who why will with would yeah yes yet you your
  `.trim().split(/\s+/),
)

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
}

export interface TopLexeme {
  value: string
  count: number
  /** Person display name who used it most, if known */
  leader: string | null
  kind: 'word' | 'phrase'
}

export function computeTopLexemes(
  messages: Array<{ text: string; fromId: string; from: string }>,
  personIds: Set<string>,
): { topWord: TopLexeme | null; topPhrase: TopLexeme | null } {
  const wordCounts = new Map<string, { count: number; by: Map<string, number> }>()
  const phraseCounts = new Map<string, { count: number; by: Map<string, number> }>()

  for (const m of messages) {
    if (!personIds.has(m.fromId)) continue
    const tokens = tokenize(m.text)
    if (tokens.length === 0) continue

    for (const w of tokens) {
      const cur = wordCounts.get(w) ?? { count: 0, by: new Map() }
      cur.count += 1
      cur.by.set(m.fromId, (cur.by.get(m.fromId) ?? 0) + 1)
      wordCounts.set(w, cur)
    }

    for (let i = 0; i < tokens.length - 1; i++) {
      const phrase = `${tokens[i]} ${tokens[i + 1]}`
      const cur = phraseCounts.get(phrase) ?? { count: 0, by: new Map() }
      cur.count += 1
      cur.by.set(m.fromId, (cur.by.get(m.fromId) ?? 0) + 1)
      phraseCounts.set(phrase, cur)
    }
  }

  const nameById = new Map<string, string>()
  for (const m of messages) {
    if (!nameById.has(m.fromId)) nameById.set(m.fromId, m.from)
  }

  function pick(
    map: Map<string, { count: number; by: Map<string, number> }>,
    kind: 'word' | 'phrase',
    minCount: number,
  ): TopLexeme | null {
    let best: TopLexeme | null = null
    for (const [value, g] of map) {
      if (g.count < minCount) continue
      if (!best || g.count > best.count) {
        const leaderEntry = [...g.by.entries()].sort((a, b) => b[1] - a[1])[0]
        best = {
          value,
          count: g.count,
          leader: leaderEntry ? nameById.get(leaderEntry[0]) ?? null : null,
          kind,
        }
      }
    }
    return best
  }

  return {
    topWord: pick(wordCounts, 'word', 3),
    topPhrase: pick(phraseCounts, 'phrase', 3),
  }
}
