// @ts-check
import { themes as prismThemes } from 'prism-react-renderer'

const REPO = 'https://github.com/kesha-antonov/react-native-zoom-reanimated'
const NPM = 'https://www.npmjs.com/package/react-native-zoom-reanimated'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Native Zoom Reanimated',
  tagline: 'Apple Photos-style pinch, pan and double-tap zoom for React Native, at 120fps',

  favicon: 'https://kesha-antonov.com/favicon.ico',
  headTags: [
    { tagName: 'link', attributes: { rel: 'icon', type: 'image/png', sizes: '192x192', href: 'https://kesha-antonov.com/favicon-192.png' } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', href: 'https://kesha-antonov.com/apple-touch-icon.png' } },
  ],
  url: 'https://kesha-antonov.com',
  baseUrl: '/react-native-zoom-reanimated/',
  organizationName: 'kesha-antonov',
  projectName: 'react-native-zoom-reanimated',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  markdown: {
    // The pages are generated from README.md, which contains raw HTML that
    // MDX would reject, so they stay CommonMark.
    format: 'detect',
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: `${REPO}/edit/main/`,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'React Native Zoom Reanimated',
        items: [
          { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
          { href: REPO, label: 'GitHub', position: 'right' },
          { href: NPM, label: 'npm', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Installation', to: '/installation' },
              { label: 'Usage', to: '/usage' },
              { label: 'API reference', to: '/api' },
              { label: 'Gesture Handler v2 / v3', to: '/gesture-api' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'GitHub', href: REPO },
              { label: 'npm', href: NPM },
              { label: 'Issues', href: `${REPO}/issues` },
              { label: 'Changelog', href: `${REPO}/blob/main/CHANGELOG.md` },
            ],
          },
          {
            title: 'Built by',
            items: [
              { label: 'Kesha Antonov', href: 'https://kesha-antonov.com' },
              { label: 'Hire a React Native lead engineer', href: 'https://kesha-antonov.com/react-native-developer/' },
              { label: 'GitHub profile', href: 'https://github.com/kesha-antonov' },
              { label: 'Sponsor', href: 'https://github.com/sponsors/kesha-antonov' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Kesha Antonov.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'ruby', 'java', 'kotlin', 'objectivec'],
      },
    }),
}

export default config
