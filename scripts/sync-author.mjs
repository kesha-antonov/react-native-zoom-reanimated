// Keeps the author line in this README in step with the canonical copy at
// https://kesha-antonov.com/readme/author.md, so it is written once rather than
// separately in every repository that carries it.
//
// Only the region between the markers is touched.
//
// Usage: node scripts/sync-author.mjs [--check] [--from <file>]
// --from reads the line from a local file instead of the site, to try an edit
// before the site is deployed.

import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'https://kesha-antonov.com/readme/author.md'
const README = 'README.md'
const START = '<!-- author:start -->'
const END = '<!-- author:end -->'

const check = process.argv.includes('--check')
const fromIndex = process.argv.indexOf('--from')
const local = fromIndex === -1 ? null : process.argv[fromIndex + 1]

async function fetchLine() {
  const response = await fetch(SOURCE)
  if (!response.ok) throw new Error(`${SOURCE} returned ${response.status}`)
  return response.text()
}

const block = local ? readFileSync(local, 'utf8') : await fetchLine()

// A broken deploy must not wipe the line: the text has to look like the author line
const looksRight = block.includes('<sub>') && block.includes('kesha-antonov.com')
if (!looksRight) throw new Error('the canonical author line does not look right, nothing changed')

const readme = readFileSync(README, 'utf8')
const from = readme.indexOf(START)
const to = readme.indexOf(END)
if (from === -1 || to === -1) throw new Error(`${README} is missing ${from === -1 ? START : END}`)

const current = readme.slice(from + START.length, to)
const wanted = `\n${block.trim()}\n`

if (current === wanted) {
  console.log(`${README} author line is already in step`)
  process.exit(0)
}

if (check) {
  console.error(`${README} author line is out of step with ${SOURCE}. Run: node scripts/sync-author.mjs`)
  process.exit(1)
}

writeFileSync(README, readme.slice(0, from + START.length) + wanted + readme.slice(to))
console.log(`updated the author line in ${README}`)
