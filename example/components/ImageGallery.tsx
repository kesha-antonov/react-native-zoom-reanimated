import React, { useState } from 'react'
import {
  FlatList,
  Image,
  useWindowDimensions,
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native'
import Zoom from 'react-native-zoom-reanimated'

/**
 * Image item interface for gallery
 */
export interface ImageItem {
  id: string
  uri: string
  width?: number
  height?: number
  title?: string
}

/**
 * Props for ImageGallery component
 */
export interface ImageGalleryProps {
  images: ImageItem[]
  isDarkMode?: boolean
  showTitles?: boolean
  doubleTapScale?: number
  minZoomScale?: number
  maxZoomScale?: number
  containerStyle?: ViewStyle
}

/**
 * Shared image gallery component with zoom functionality
 * Supports horizontal swiping between images and pinch/pan/double-tap zoom
 *
 * @example
 * ```tsx
 * const images = [
 *   { id: '1', uri: 'https://example.com/1.jpg', title: 'Image 1' },
 *   { id: '2', uri: 'https://example.com/2.jpg', title: 'Image 2' },
 * ]
 *
 * <ImageGallery
 *   images={images}
 *   showTitles
 *   doubleTapScale={2}
 * />
 * ```
 */
export default function ImageGallery({
  images,
  isDarkMode = false,
  showTitles = true,
  doubleTapScale = 2,
  minZoomScale = 1,
  maxZoomScale = 5,
  containerStyle,
}: ImageGalleryProps): React.JSX.Element {
  const { width: deviceWidth, height: deviceHeight } = useWindowDimensions()

  const renderImageItem = ({ item }: { item: ImageItem }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    // Calculate image dimensions to fit screen width while maintaining aspect ratio
    const imageAspectRatio = item.width && item.height
      ? item.width / item.height
      : 1
    const imageHeight = deviceWidth / imageAspectRatio

    return (
      <View style={[styles.imageContainer, { width: deviceWidth, height: deviceHeight }]}>
        <Zoom
          style={styles.zoomContainer}
          doubleTapConfig={{
            defaultScale: doubleTapScale,
            minZoomScale,
            maxZoomScale,
          }}
        >
          <Image
            source={{ uri: item.uri }}
            resizeMode="contain"
            style={{
              width: deviceWidth,
              height: imageHeight,
            }}
            onLoadStart={() => {
              setIsLoading(true)
              setHasError(false)
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
            </View>
          )}
          {hasError && (
            <View style={styles.loadingOverlay}>
              <Text style={[styles.errorText, { color: isDarkMode ? '#ff6b6b' : '#d32f2f' }]}>
                Failed to load image
              </Text>
            </View>
          )}
        </Zoom>
        {showTitles && item.title && (
          <Text style={[styles.imageTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {item.title}
          </Text>
        )}
      </View>
    )
  }

  return (
    <FlatList
      data={images}
      renderItem={renderImageItem}
      keyExtractor={(item) => item.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.flatList, containerStyle]}
    />
  )
}

const styles = StyleSheet.create({
  flatList: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    position: 'absolute',
    bottom: 50,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
})
