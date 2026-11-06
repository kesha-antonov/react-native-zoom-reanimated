import React from 'react'
import MDXContent from '@theme-original/MDXContent'
import { useLocation } from '@docusaurus/router'
import useBaseUrl from '@docusaurus/useBaseUrl'
import ZoomDemo from '@site/src/components/ZoomDemo'

// The intro page is generated from README.md, which can't hold a React
// component, so the overview animation is placed here, above its first section.
export default function MDXContentWrapper(props) {
  const isIntro = useLocation().pathname === useBaseUrl('/')
  return (
    <>
      {isIntro && <ZoomDemo />}
      <MDXContent {...props} />
    </>
  )
}
