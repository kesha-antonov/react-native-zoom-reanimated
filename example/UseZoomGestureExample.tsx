import React, { useState } from 'react'
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Text,
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedReaction, runOnJS } from 'react-native-reanimated'
import { useZoomGesture } from 'react-native-zoom-reanimated'

interface UseZoomGestureExampleProps {
  isDarkMode?: boolean
}

/**
 * Example demonstrating direct usage of useZoomGesture hook
 * Shows how to:
 * - Use the hook for custom implementations
 * - Monitor zoom state changes
 * - Programmatically control zoom
 * - Use custom animation configurations
 */
export default function UseZoomGestureExample({ isDarkMode = false }: UseZoomGestureExampleProps) {
  const { width: deviceWidth } = useWindowDimensions()
  const [zoomStatus, setZoomStatus] = useState('Not Zoomed')
  const [lastInteraction, setLastInteraction] = useState<string>('')

  const imageWidth = 1100
  const imageHeight = 910

  const {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
    isZoomedIn,
    zoomGestureLastTime,
  } = useZoomGesture({
    doubleTapConfig: {
      defaultScale: 3,
      minZoomScale: 1.5,
      maxZoomScale: 6,
    },
    animationConfig: {
      duration: 300,
    },
  })

  // Monitor zoom state changes
  useAnimatedReaction(
    () => isZoomedIn.value,
    (zoomed) => {
      runOnJS(setZoomStatus)(zoomed ? 'Zoomed In' : 'Zoomed Out')
    }
  )

  // Monitor last interaction time
  useAnimatedReaction(
    () => zoomGestureLastTime.value,
    (time) => {
      if (time > 0)
        runOnJS(setLastInteraction)(new Date(time).toLocaleTimeString())

    }
  )

  const handleResetZoom = () => {
    if (isZoomedIn.value)
      zoomOut()

  }

  return (
    <View style={styles.container}>
      {/* Status Panel */}
      <View style={[styles.statusPanel, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
        <Text style={[styles.statusText, { color: isDarkMode ? '#fff' : '#000' }]}>
          Status: {zoomStatus}
        </Text>
        {lastInteraction && (
          <Text style={[styles.statusText, { color: isDarkMode ? '#aaa' : '#666' }]}>
            Last interaction: {lastInteraction}
          </Text>
        )}
      </View>

      {/* Zoomable Image using useZoomGesture hook */}
      <View style={styles.zoomableContainer}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <GestureDetector gesture={zoomGesture as any}>
          <View style={styles.gestureContainer} onLayout={onLayout}>
            <Animated.View
              style={[styles.animatedContent, contentContainerAnimatedStyle]}
              onLayout={onLayoutContent}
            >
              <Image
                source={{ uri: 'https://fujifilm-x.com/wp-content/uploads/2021/01/gfx100s_sample_04_thum-1.jpg' }}
                resizeMode="contain"
                style={{
                  width: deviceWidth,
                  height: imageHeight * deviceWidth / imageWidth,
                }}
              />
            </Animated.View>
          </View>
        </GestureDetector>
      </View>

      {/* Control Panel */}
      <View style={[styles.controlPanel, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isZoomedIn.value ? '#FF6B6B' : '#ccc' },
          ]}
          onPress={handleResetZoom}
          disabled={!isZoomedIn.value}
        >
          <Text style={styles.buttonText}>Reset Zoom</Text>
        </TouchableOpacity>

        <Text style={[styles.infoText, { color: isDarkMode ? '#aaa' : '#666' }]}>
          Double tap to zoom • Pinch to zoom • Pan when zoomed
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  zoomableContainer: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animatedContent: {
    // Animated content container
  },
  controlPanel: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
  },
})
