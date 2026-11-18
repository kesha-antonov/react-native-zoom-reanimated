import React from 'react'
import MDXContent from '@theme-original/MDXContent'
import Head from '@docusaurus/Head'
import { useDoc } from '@docusaurus/plugin-content-docs/client'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import ZoomDemo from '@site/src/components/ZoomDemo'

// The intro page is generated from README.md, which can't hold a React
// component, so the overview animation is placed here, above its first section.
export default function MDXContentWrapper(props) {
  const isIntro = useLocation().pathname === useBaseUrl('/')
  // A page generated with a head_title gets it as its <title>, while its h1
  // keeps the shorter frontmatter title.
  const headTitle = useDoc().frontMatter.head_title
  return (
    <>
      {headTitle && (
        <Head>
          <title>{headTitle}</title>
          <meta property="og:title" content={headTitle} />
        </Head>
      )}
      {isIntro && <ZoomDemo />}
      <MDXContent {...props} />
    </>
  )
}
