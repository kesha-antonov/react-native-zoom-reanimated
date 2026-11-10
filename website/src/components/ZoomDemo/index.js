import React from 'react'
import BrowserOnly from '@docusaurus/BrowserOnly'
import { useColorMode } from '@docusaurus/theme-common'

// The animated overview on the intro page: a photo viewer where each gesture
// the library handles happens once, named in a feature list beside it.
function Themed() {
  const { colorMode } = useColorMode()
  const Demo = require('./Demo').default
  return <Demo theme={colorMode === 'dark' ? 'dark' : 'light'} />
}

export default function ZoomDemo() {
  return (
    <figure
      className="zoom-demo"
      role="img"
      aria-label="A photo viewer on a phone: a double tap zooms to 2x where it lands, a pinch zooms on the tram's destination board past 4x and springs back, a flick glides and bounces off the edge, and a swipe at the edge pages to the next photo."
    >
      <BrowserOnly fallback={<div className="zoom-demo__placeholder" />}>{() => <Themed />}</BrowserOnly>
    </figure>
  )
}
