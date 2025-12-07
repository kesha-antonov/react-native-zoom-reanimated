import React from 'react'
import ImageGallery, { type ImageItem } from './components/ImageGallery'

/**
 * Example implementation for image gallery with zoomable images and sliding pages
 * This addresses the request from issue #6 for the code shown in the video
 *
 * This is a standalone example that can be copy-pasted into other projects
 */

const IMAGES: ImageItem[] = [
  {
    id: '1',
    uri: 'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg',
  },
  {
    id: '2',
    uri: 'https://cdn.hasselblad.com/hasselblad-com/6cb604081ef3086569319ddb5adcae66298a28c5_x1d-ii-sample-01-web.jpg?auto=format&q=97',
  },
  {
    id: '3',
    uri: 'https://cdn.pixabay.com/photo/2022/01/28/18/32/leaves-6975462_1280.png',
  },
]

/**
 * Standalone image gallery example
 * Simple implementation with minimal configuration
 */
export default function ImageGalleryStandalone() {
  return (
    <ImageGallery
      images={IMAGES}
      showTitles={false}
      doubleTapScale={2}
      minZoomScale={1}
      maxZoomScale={5}
    />
  )
}
