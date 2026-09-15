// Keeps the cryptoc promo block in this README in step with the canonical copy
// at https://cryptoc-app.web.app/promo/readme-block.md, so the block is written
// once rather than separately in every repository that carries it.
//
// Only the region between the markers is touched. {{INTRO}} and {{NOTE}} in the
// canonical block are filled from .github/promo.json when present, so a repo can
// keep its own wording without forking the whole block.
//
// Usage: node scripts/sync-promo.mjs [--check]

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const SOURCE = 'https://cryptoc-app.web.app/promo/readme-block.md'
const README = 'README.md'
const CONFIG = '.github/promo.json'
const START = '<!-- cryptoc-promo:start -->'
const END = '<!-- cryptoc-promo:end -->'

const DEFAULTS = {
  intro: [
    '### Support my work',
    '',
    '**[cryptoc](https://cryptoc-app.web.app/)** - my crypto portfolio app. Your coins on the home screen, lock screen and watch face. iPhone, iPad, Mac, Apple Watch, Android, Android tablet and Wear OS.',
  ].join('\n'),
  note: 'Downloading it is what pays for the time that goes into these libraries.',
}

const check = process.argv.includes('--check')

const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`${SOURCE} returned ${response.status}`)
let block = await response.text()

const config = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, 'utf8')) : {}
block = block
  .replaceAll('{{INTRO}}', config.intro ?? DEFAULTS.intro)
  .replaceAll('{{NOTE}}', config.note ?? DEFAULTS.note)

if (block.includes('{{')) throw new Error('canonical block still has an unfilled placeholder')

const readme = readFileSync(README, 'utf8')
const from = readme.indexOf(START)
const to = readme.indexOf(END)
if (from === -1 || to === -1) throw new Error(`${README} is missing ${from === -1 ? START : END}`)

const current = readme.slice(from + START.length, to)
const wanted = `\n${block.trim()}\n`

if (current === wanted) {
  console.log(`${README} promo block is already in step`)
  process.exit(0)
}

if (check) {
  console.error(`${README} promo block is out of step with ${SOURCE}. Run: node scripts/sync-promo.mjs`)
  process.exit(1)
}

writeFileSync(README, readme.slice(0, from + START.length) + wanted + readme.slice(to))
console.log(`updated the promo block in ${README}`)
