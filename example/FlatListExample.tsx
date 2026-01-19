import React from 'react'
import ImageGallery, { type ImageItem } from './components/ImageGallery'

const SAMPLE_IMAGES: ImageItem[] = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    width: 1200,
    height: 800,
    title: 'Mountain Landscape',
  },
  {
    id: '2',
    uri: 'https://cdn.hasselblad.com/hasselblad-com/6cb604081ef3086569319ddb5adcae66298a28c5_x1d-ii-sample-01-web.jpg?auto=format&q=97',
    width: 1200,
    height: 800,
    title: 'Hasselblad Sample',
  },
  {
    id: '3',
    uri: 'https://vgl.ucdavis.edu/sites/g/files/dgvnsk15116/files/styles/sf_landscape_4x3/public/images/marketing_highlight/Sample-Collection-Box-Cat-640px.jpg?h=52d3fcb6&itok=4r75E_w2',
    width: 640,
    height: 480,
    title: 'Cat Sample',
  },
  {
    id: '4',
    uri: 'https://cdn.pixabay.com/photo/2022/01/28/18/32/leaves-6975462_1280.png',
    width: 1280,
    height: 853,
    title: 'Leaves Sample',
  },
  {
    id: '5',
    uri: 'https://images.unsplash.com/photo-1518877593221-1f28583780b4?w=1200',
    width: 1200,
    height: 800,
    title: 'Whale Tail',
  },
]

interface FlatListExampleProps {
  isDarkMode?: boolean
}

/**
 * Example component showing image gallery with zoom functionality
 * Uses the shared ImageGallery component with sample images
 */
export default function FlatListExample({ isDarkMode = false }: FlatListExampleProps) {
  return (
    <ImageGallery
      images={SAMPLE_IMAGES}
      isDarkMode={isDarkMode}
      showTitles
      doubleTapScale={2}
      minZoomScale={1}
      maxZoomScale={5}
    />
  )
}
