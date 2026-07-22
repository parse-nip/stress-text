/**
 * Laugh detector smoke test.
 * Run: npx tsx src/lib/laughs.test.ts
 */
import { countLaughs } from './laughs'

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

assert(countLaughs('hello there') === 0, 'no laughs')
assert(countLaughs('hahaha that was wild') === 1, 'hahaha')
assert(countLaughs('lol lmao haha') === 3, 'three tokens')
assert(countLaughs('😂 🤣 nice') === 2, 'emoji laughs')
assert(countLaughs('HeHeHe') === 1, 'case insensitive')

console.log('✓ laughs tests passed')
