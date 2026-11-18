// The root of this docs site is served without a trailing slash, for example
// https://kesha-antonov.com/react-native-chat. GitHub Pages serves a project
// site's root only at the slashed address, so two Cloudflare rules on the
// kesha-antonov.com zone cover the rest: a URL rewrite serves the slashless
// address from the slashed one, and a redirect sends the slashed address to the
// slashless one. Both match every /react-native-* folder except the portfolio's
// /react-native-developer page.
//
// Docusaurus writes the root with the slash of baseUrl. This plugin corrects the
// built pages (canonical, og:url, hreflang, breadcrumb data and links to the
// root) and, in the browser, the address bar once the app has moved to the root.
// The sitemap entry is corrected in docusaurus.config.js: the sitemap is written
// by its own plugin while this one runs.

const fs = require('node:fs/promises')
const path = require('node:path')

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

async function htmlFiles (dir) {
  const files = []
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await htmlFiles(file))
    else if (entry.name.endsWith('.html')) files.push(file)
  }
  return files
}

module.exports = function slashlessRoot (context) {
  const { url, baseUrl } = context.siteConfig
  const root = baseUrl.replace(/\/$/, '')
  // "/react-native-chat/" or "https://kesha-antonov.com/react-native-chat/" as an
  // attribute value or a JSON-LD address, also with a #fragment after the slash
  const rootWithSlash = new RegExp(
    `((?:href|content)="|"(?:url|item|@id)":")((?:${escape(url)})?${escape(root)})/(?=["#])`,
    'g'
  )
  return {
    name: 'slashless-root',
    getClientModules () {
      return [path.resolve(__dirname, '../src/slashless-root-client.js')]
    },
    async postBuild ({ outDir }) {
      for (const file of await htmlFiles(outDir)) {
        const html = await fs.readFile(file, 'utf8')
        const fixed = html.replace(rootWithSlash, '$1$2')
        if (fixed !== html) await fs.writeFile(file, fixed)
      }
    },
  }
}
