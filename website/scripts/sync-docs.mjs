// Generates the Docusaurus docs from the markdown that already lives in the
// repository root, so README.md stays the single
// source of truth and the site can never drift away from them.
//
// Run via `yarn sync` (also runs automatically before `start` and `build`).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const OUT = join(HERE, '..', 'docs')

const REPO = 'https://github.com/kesha-antonov/react-native-zoom-reanimated'
const BRANCH = 'main'
// Where the site is served from, for files in website/static.
const BASE_URL = '/react-native-zoom-reanimated/'

/**
 * Canonical key for a heading or a link anchor.
 *
 * GitHub and Docusaurus slugify headings slightly differently (emoji and
 * variation selectors are the painful part), so instead of reimplementing
 * either algorithm we reduce both sides to letters and digits only. That is
 * stable enough to match `#-features` against `## ✨ Features`, and we then
 * emit explicit `{#key}` anchors so the generated site uses these keys too.
 */
const key = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Pages, in sidebar order. `from` is either README sections or a whole file. */
const PAGES = [
  {
    id: "intro",
    slug: "/",
    title: "React Native Zoom Reanimated",
    sidebarLabel: "Introduction",
    description:
      "A pinch, pan and double-tap zoom component for React Native built on Reanimated and Gesture Handler, with Apple Photos-style rubber banding at 120fps.",
    keywords: ["react native pinch to zoom", "react native image zoom", "reanimated zoom"],
    sections: ["✨ Features", "📸 Preview"],
    headTitle: "React Native Pinch to Zoom and Image Zoom with Reanimated",
    lead: true,
    install: "📦 Installation",
  },
  {
    id: "installation",
    title: "Installation",
    sidebarLabel: "Installation",
    description:
      "Requirements and install steps, including the Reanimated and Gesture Handler peer dependencies.",
    keywords: ["react-native-zoom-reanimated install"],
    sections: ["📋 Requirements", "📦 Installation"],
    excerpts: [{ section: "💡 Examples", heading: "Basic Usage", title: "Basic Usage", next: "usage" }],
  },
  {
    id: "usage",
    title: "Usage",
    sidebarLabel: "Usage",
    description:
      "Wrap any view in Zoom to get pinch, pan and double-tap gestures, with worked examples including an Apple Photos-style gallery.",
    keywords: ["react native zoom component", "zoom flatlist"],
    sections: ["🚀 Usage", "💡 Examples"],
  },
  {
    id: "api",
    title: "API reference",
    sidebarLabel: "API reference",
    description:
      "API reference for react-native-zoom-reanimated: every prop of the Zoom component, plus the DoubleTapConfig and ScrollableRef types.",
    keywords: ["react-native-zoom-reanimated props"],
    sections: ["📖 API Reference"],
  },
  {
    id: "hook",
    title: "The useZoomGesture hook",
    sidebarLabel: "useZoomGesture hook",
    description:
      "Build your own zoomable view with the hook instead of the component, for full control over the gesture tree.",
    keywords: ["useZoomGesture", "custom zoom gesture react native"],
    sections: ["🔧 Advanced Usage: useZoomGesture Hook"],
  },
  {
    id: "gesture-api",
    title: "Gesture Handler v2 / v3 API",
    sidebarLabel: "Gesture Handler v2 / v3",
    description:
      "The library builds its gesture with either the v2 builder API or the v3 hooks API, detected from the installed react-native-gesture-handler.",
    keywords: ["gesture handler 3 react native", "usePanGesture"],
    sections: ["🎛 Gesture Handler v2 / v3 API"],
  },
  {
    id: "example-app",
    title: "Example app and platforms",
    sidebarLabel: "Example app",
    description:
      "Run the react-native-zoom-reanimated example app with a FlatList image gallery and Apple Photos-style navigation. The library supports iOS and Android.",
    keywords: ["react-native-zoom-reanimated example"],
    sections: ["📦 Example App", "📱 Platform Support"],
  },
  {
    id: "contributing",
    title: "Contributing",
    sidebarLabel: "Contributing",
    description:
      "Contribute to react-native-zoom-reanimated: fork the repository, create a feature branch, run the TypeScript and ESLint checks and open a pull request.",
    keywords: ["contributing"],
    sections: ["🤝 Contributing"],
  },
]

const read = (relative) => readFileSync(join(ROOT, relative), 'utf8')

/**
 * Splits a markdown document into top-level (`##`) sections, ignoring headings
 * that appear inside fenced code blocks.
 */
function splitSections (markdown) {
  const lines = markdown.split('\n')
  const sections = new Map()
  let current = null
  let fenced = false

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced

    const heading = !fenced && /^## (.+?)\s*$/.exec(line)
    if (heading) {
      current = { title: heading[1], lines: [] }
      sections.set(current.title, current)
      continue
    }
    if (current) current.lines.push(line)
  }

  return sections
}

/** Collects every heading in a chunk of markdown, outside of code fences. */
function headingsIn (markdown) {
  const found = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const m = !fenced && /^(#{1,6}) (.+?)\s*$/.exec(line)
    if (m) found.push(m[2])
  }
  return found
}

/** Drops a "## Table of Contents" section - Docusaurus renders its own. */
function stripTableOfContents (markdown) {
  return markdown.replace(/^##+ Table of Contents\s*$[\s\S]*?(?=^##? )/m, '')
}

/**
 * Promotes headings by one level and gives each an explicit `{#key}` anchor so
 * that generated links resolve to a slug we control rather than one inferred
 * from emoji.
 */
function normaliseHeadings (markdown, depth) {
  let fenced = false
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        fenced = !fenced
        return line
      }
      if (fenced) return line

      const m = /^(#{1,6}) (.+?)\s*$/.exec(line)
      if (!m) return line
      if (/\{#[^}]+\}\s*$/.test(m[2])) return line

      const level = Math.max(2, m[1].length - depth)
      return `${'#'.repeat(level)} ${m[2]} {#${key(m[2])}}`
    })
    .join('\n')
}

// Build the anchor -> page map before rendering, so cross-page links resolve.
const readme = read('README.md')
const readmeSections = splitSections(readme)
const anchorToPage = new Map()

for (const page of PAGES) {
  const bodies = page.sections
    ? page.sections.map((title) => {
        const section = readmeSections.get(title)
        if (!section) throw new Error(`README section not found: "${title}". Update website/scripts/sync-docs.mjs.`)
        return `## ${section.title}\n${section.lines.join('\n')}`
      })
    : [read(page.file)]

  page.raw = bodies.join('\n\n')

  // When a page is built from a single README section, that section's own
  // heading just repeats the page title, so it is dropped and its subheadings
  // are promoted one level. Links that pointed at it become links to the page.
  page.droppedHeading = page.sections?.length === 1 ? key(page.sections[0]) : null

  for (const heading of headingsIn(page.raw)) {
    if (!anchorToPage.has(key(heading))) anchorToPage.set(key(heading), page.id)
  }
}

/** Anchors that no longer exist because their heading became the page title. */
const droppedAnchors = new Map(
  PAGES.filter((page) => page.droppedHeading).map((page) => [page.droppedHeading, page.id])
)

/**
 * Resolves a canonical anchor key to a markdown link, or null if it is unknown.
 * Anchors whose heading was dropped resolve to the page itself.
 */
function linkTo (k, pageId) {
  const droppedOn = droppedAnchors.get(k)
  if (droppedOn) return `](./${droppedOn}.md)`

  const target = anchorToPage.get(k)
  if (!target) return null
  return target === pageId ? `](#${k})` : `](./${target}.md#${k})`
}

/** Rewrites README/GitHub-relative links to links between generated pages. */
function rewriteLinks (markdown, pageId) {
  const fileRoutes = []

  let out = markdown

  for (const [pattern, target] of fileRoutes) {
    out = out.replace(pattern, (_match, hash) => {
      const anchor = hash ? `#${key(hash.slice(1))}` : ''
      return `](./${target}.md${anchor})`
    })
  }

  // Links back into README.md from the standalone docs files.
  out = out.replace(/\]\(\.\.?\/?README\.md(#[^)]*)?\)/g, (_match, hash) => {
    if (!hash) return '](./intro.md)'
    return linkTo(key(hash.slice(1)), pageId) ?? '](./intro.md)'
  })

  // Plain in-page anchors, which may now live on a different page.
  out = out.replace(/\]\(#([^)]+)\)/g, (match, anchor) => linkTo(key(anchor), pageId) ?? match)

  // Repository files and folders that have no page of their own: point them at
  // GitHub instead of letting them resolve to a 404 inside the docs site.
  out = out.replace(/\]\(\.?\/?(LICENSE|CHANGELOG\.md|llms\.txt|[A-Z][A-Z_]+(?:\.[a-z]+)?)\)/g, `](${REPO}/blob/${BRANCH}/$1)`)
  out = out.replace(/\]\(\.?\/?(examples?|src|scripts|docs|__tests__)\/?\)/g, `](${REPO}/tree/${BRANCH}/$1)`)
  out = out.replace(/\]\(\.?\/?((?:examples?|src|scripts|docs|__tests__)\/[^)\s]+)\)/g, (_match, path) => {
    // A path without a file extension is a folder, which GitHub serves under tree/.
    const kind = /\.[A-Za-z0-9]+$/.test(path) ? 'blob' : 'tree'
    return `](${REPO}/${kind}/${BRANCH}/${path})`
  })

  // Root-level markdown with no page of its own (AGENTS.md, MIGRATION.md, ...).
  // Links the generator itself produced point at a page id and are left alone.
  out = out.replace(/\]\(\.?\/?([A-Za-z0-9_.-]+\.md)(#[^)]*)?\)/g, (match, file) => {
    const id = file.replace(/\.md$/, '')
    if (PAGES.some((page) => page.id === id)) return match
    return `](${REPO}/blob/${BRANCH}/${file})`
  })

  return out
}

function frontmatter (page, index) {
  const fields = [
    `title: ${JSON.stringify(page.title)}`,
    `sidebar_label: ${JSON.stringify(page.sidebarLabel)}`,
    `sidebar_position: ${index + 1}`,
    `description: ${JSON.stringify(page.description)}`,
  ]
  if (page.slug) fields.push(`slug: ${JSON.stringify(page.slug)}`)
  // A browser title that differs from the heading. The frontmatter title stays
  // the visible h1, and src/theme/MDXContent puts this one into <title>.
  if (page.headTitle) fields.push(`head_title: ${JSON.stringify(page.headTitle)}`)
  if (page.keywords?.length) fields.push(`keywords: [${page.keywords.map((k) => JSON.stringify(k)).join(', ')}]`)
  return `---\n${fields.join('\n')}\n---\n`
}

/** The one-sentence summary that sits under the title in the README header. */
function readmeLead (markdown) {
  const m = /<h1[^>]*>[^<]*<\/h1>\s*<p[^>]*>\s*([^<]+?)\s*<\/p>/.exec(markdown)
  if (!m) throw new Error('README summary paragraph not found. Update website/scripts/sync-docs.mjs.')
  return m[1].replace(/\s+/g, ' ')
}

function sectionLines (title) {
  const section = readmeSections.get(title)
  if (!section) throw new Error(`README section not found: "${title}". Update website/scripts/sync-docs.mjs.`)
  return section.lines
}

/** Fenced code blocks of a README section, each returned with its fences. */
function codeBlocksIn (title) {
  const blocks = []
  let block = null
  for (const line of sectionLines(title)) {
    const fence = /^\s*(```|~~~)/.test(line)
    if (fence && !block) {
      block = [line]
      continue
    }
    if (block) block.push(line)
    if (fence) {
      blocks.push(block.join('\n'))
      block = null
    }
  }
  return blocks
}

/** The body of one subsection of a README section, without its heading. */
function subsection (title, heading) {
  const found = []
  let inside = false
  let fenced = false
  for (const line of sectionLines(title)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const m = !fenced && /^#{3,6} (.+?)\s*$/.exec(line)
    if (m) {
      if (inside) break
      inside = m[1] === heading
      continue
    }
    if (inside) found.push(line)
  }
  if (!found.length) throw new Error(`README subsection not found: "${heading}". Update website/scripts/sync-docs.mjs.`)
  return found.join('\n').trim()
}

/**
 * Parts of the README that a page repeats from a section owned by another
 * page: the summary and install commands on the landing page, a first snippet
 * on the installation page. They are added after the anchor map is built, so
 * links keep pointing at the page that owns the section.
 */
function extras (page) {
  const before = []
  const after = []

  if (page.lead) before.push(readmeLead(readme))

  if (page.install) {
    const target = PAGES.find((other) => other.id === 'installation')
    after.push(`## ${target.title} {#install}\n\n${codeBlocksIn(page.install).join('\n\n')}\n\nMore in [${target.title}](./${target.id}.md).`)
  }

  for (const excerpt of page.excerpts ?? []) {
    const next = PAGES.find((other) => other.id === excerpt.next)
    const more = next ? `\n\nContinue with [${next.title}](./${next.id}.md).` : ''
    after.push(`## ${excerpt.title} {#${key(excerpt.title)}}\n\n${subsection(excerpt.section, excerpt.heading)}${more}`)
  }
  return { before, after }
}

/**
 * The README shows its preview as bare GitHub attachment links, which GitHub
 * turns into players and a docs page would print as plain urls. On the site
 * they become players for the copies kept in website/static/video.
 */
const VIDEOS = [
  {
    url: 'https://github.com/user-attachments/assets/9da40463-7b70-46bb-bfe3-eb0ab4f8feb7',
    file: 'video/preview-ios.mp4',
    width: 300,
    height: 660,
    label: 'Preview of react-native-zoom-reanimated on iOS',
  },
  {
    url: 'https://github.com/kesha-antonov/react-native-zoom-reanimated/assets/11584712/7e8a572b-8130-4aea-88c7-2ca035a155a1',
    file: 'video/preview-android.mp4',
    width: 300,
    height: 667,
    label: 'Preview of react-native-zoom-reanimated on Android',
  },
]

function embedVideos (markdown) {
  let out = markdown
  for (const video of VIDEOS) {
    const src = `${BASE_URL}${video.file}`
    const player = `<video controls muted loop playsinline preload="metadata" width="${video.width}" height="${video.height}" src="${src}" aria-label="${video.label}" style="max-width: 100%; height: auto;">${video.label}</video>`
    out = out.split('\n').map((line) => (line.trim() === video.url ? player : line)).join('\n')
  }
  return out
}
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

PAGES.forEach((page, index) => {
  let body = stripTableOfContents(page.raw)
  // Standalone files lead with an `# H1` that the frontmatter title replaces.
  body = body.replace(/^#\s+.+?\n/, '')

  // Same for a single README section: its `##` heading is the page title.
  let depth = 0
  if (page.droppedHeading) {
    body = body.replace(/^##\s+.+?\n/, '')
    depth = 1
  }

  body = normaliseHeadings(body, depth)

  const { before, after } = extras(page)
  // A README section can end with a horizontal rule, which would otherwise sit
  // between it and the parts added below.
  if (after.length) body = body.trim().replace(/\n---$/, '')
  body = [...before, body.trim(), ...after].join('\n\n')

  body = rewriteLinks(body, page.id)
  body = embedVideos(body)

  const source = page.file ?? 'README.md'
  const note = `<!-- Generated from ${source} by website/scripts/sync-docs.mjs - edit that file, not this one. -->\n`

  writeFileSync(join(OUT, `${page.id}.md`), `${frontmatter(page, index)}\n${note}\n${body.trim()}\n`)
})

console.log(`Generated ${PAGES.length} pages into website/docs from README.md`)
