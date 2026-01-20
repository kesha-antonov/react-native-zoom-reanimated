import React, { useState, useCallback, useRef } from 'react'
import {
  useWindowDimensions,
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { Image } from 'expo-image'
import Animated, { LinearTransition } from 'react-native-reanimated'
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
  /**
   * Gap between images in the gallery (Apple Photos style).
   * Creates black spacing between images while swiping.
   * Default is 20.
   */
  imageGap?: number
}

/**
 * Props for individual gallery image item
 */
interface GalleryImageItemProps {
  item: ImageItem
  index: number
  deviceWidth: number
  deviceHeight: number
  isDarkMode: boolean
  doubleTapScale: number
  minZoomScale: number
  maxZoomScale: number
  flatListRef: React.RefObject<FlatList<ImageItem> | null>
  imageGap: number
  itemWidth: number
}

/**
 * Individual image item component for the gallery
 */
function GalleryImageItem({
  item,
  index,
  deviceWidth,
  deviceHeight,
  isDarkMode,
  doubleTapScale,
  minZoomScale,
  maxZoomScale,
  flatListRef,
  imageGap,
  itemWidth,
}: GalleryImageItemProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Calculate image dimensions to fit container (aspect fit)
  const imageAspectRatio = item.width && item.height
    ? item.width / item.height
    : 1
  const containerAspectRatio = deviceWidth / deviceHeight

  // Aspect fit: fit to width or height depending on aspect ratios
  let imageWidth: number
  let imageHeight: number

  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider than container - fit to width
    imageWidth = deviceWidth
    imageHeight = deviceWidth / imageAspectRatio
  }
  else {
    // Image is taller than container - fit to height
    imageHeight = deviceHeight
    imageWidth = deviceHeight * imageAspectRatio
  }

  // Item container includes gap, but image displays at deviceWidth
  return (
    <View style={[styles.imageContainer, { width: itemWidth, height: deviceHeight }]}>
      <Zoom
        style={[styles.zoomContainer, { width: deviceWidth, height: deviceHeight, marginRight: imageGap }]}
        doubleTapConfig={{
          defaultScale: doubleTapScale,
          minZoomScale,
          maxZoomScale,
        }}
        enableGallerySwipe
        parentScrollRef={flatListRef}
        currentIndex={index}
        itemWidth={itemWidth}
      >
        <Image
          source={{ uri: item.uri }}
          contentFit="contain"
          style={{
            width: imageWidth,
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
      </Zoom>
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
    </View>
  )
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
  imageGap = 20,
}: ImageGalleryProps): React.JSX.Element {
  const { width: deviceWidth } = useWindowDimensions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const flatListRef = useRef<FlatList<ImageItem> | null>(null)

  // Item width includes gap for proper snapping
  const itemWidth = deviceWidth + imageGap

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height)
  }, [])

  const renderImageItem = ({ item, index }: { item: ImageItem; index: number }) => (
    <GalleryImageItem
      item={item}
      index={index}
      deviceWidth={deviceWidth}
      deviceHeight={containerHeight}
      isDarkMode={isDarkMode}
      doubleTapScale={doubleTapScale}
      minZoomScale={minZoomScale}
      maxZoomScale={maxZoomScale}
      flatListRef={flatListRef}
      imageGap={imageGap}
      itemWidth={itemWidth}
    />
  )

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / itemWidth)
    if (index !== currentIndex && index >= 0 && index < images.length)
      setCurrentIndex(index)
  }

  return (
    <View style={[styles.container, containerStyle]} onLayout={handleLayout}>
      {containerHeight > 0 && (
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.flatList}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentContainerStyle={{ paddingRight: imageGap }}
        />
      )}
      <Animated.View
        layout={LinearTransition.duration(300)}
        style={[
          styles.pageIndicator,
          { backgroundColor: isDarkMode ? 'rgba(42,42,42,0.7)' : 'rgba(255,255,255,0.7)' },
        ]}
      >
        <Animated.Text
          layout={LinearTransition.duration(300)}
          style={[
            styles.pageIndicatorText,
            { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' },
          ]}
        >
          {currentIndex + 1}/{images.length}
        </Animated.Text>
        {showTitles && images[currentIndex]?.title && (
          <Animated.Text
            layout={LinearTransition.duration(300)}
            style={[
              styles.pageTitleText,
              { color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
            ]}
          >
            {images[currentIndex].title}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatList: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  zoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  pageTitleText: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
})
