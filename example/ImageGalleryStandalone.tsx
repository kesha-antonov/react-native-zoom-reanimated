import React from 'react'
import { FlatList, Image, useWindowDimensions, View, StyleSheet } from 'react-native'
import Zoom from 'react-native-zoom-reanimated'

// Example implementation for image gallery with zoomable images and sliding pages
// This addresses the request from issue #6 for the code shown in the video

const IMAGES = [
  'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg',
  'https://cdn.hasselblad.com/hasselblad-com/6cb604081ef3086569319ddb5adcae66298a28c5_x1d-ii-sample-01-web.jpg?auto=format&q=97',
  'https://cdn.pixabay.com/photo/2022/01/28/18/32/leaves-6975462_1280.png',
  // Add more image URLs as needed
]

export default function ImageGalleryExample () {
  const { width: screenWidth } = useWindowDimensions()

  const renderImage = ({ item: imageUri }: { item: string }) => (
    <View style={[styles.slide, { width: screenWidth }]}>
      <Zoom
        doubleTapConfig={{
          defaultScale: 2,
          minZoomScale: 1,
          maxZoomScale: 5,
        }}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </Zoom>
    </View>
  )

  return (
    <FlatList
      data={IMAGES}
      renderItem={renderImage}
      keyExtractor={(item, index) => index.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
})
