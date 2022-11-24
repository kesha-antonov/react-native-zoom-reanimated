import React, { useState, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'

function Zoom ({ style, contentContainerStyle, children }) {
  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useSharedValue(1)
  const isZoomedIn = useSharedValue(false)
  const [panGestureEnabled, setPanGestureEnabled] = useState(false)

  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentDimensions, setContainerDimensions] = useState(() => ({ width: 1, height: 1 }))

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffsetX = useSharedValue(0)
  const lastOffsetY = useSharedValue(0)

  const getContentContainerSize = useCallback(() => {
    return ({
      width: containerWidth,
      height: contentDimensions.height * containerWidth / contentDimensions.width,
    })
  }, [contentDimensions, containerWidth])

  const zoomIn = useCallback(() => {
    const { width, height } = getContentContainerSize()

    // TODO: MAKE SMARTER CHOISE BASED ON AVAILABLE FREE VERTICAL SPACE
    let newScale = width > height ? width / height * 0.8 : height / width * 0.8
    if (newScale < 1.4)
      newScale = 1.4
    else if (newScale > 1.5)
      newScale = 1.5

    lastScale.value = newScale

    baseScale.value = withSpring(newScale)
    pinchScale.value = withSpring(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = newOffsetX
    translateY.value = newOffsetY

    isZoomedIn.value = true
    setPanGestureEnabled(true)
  }, [baseScale, pinchScale, getContentContainerSize, lastOffsetX, lastOffsetY, translateX, translateY, isZoomedIn, lastScale])

  const zoomOut = useCallback(() => {
    const newScale = 1
    lastScale.value = newScale
    baseScale.value = withSpring(newScale)
    pinchScale.value = withSpring(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = withSpring(newOffsetX)
    translateY.value = withSpring(newOffsetY)

    isZoomedIn.value = false

    setPanGestureEnabled(false)
  }, [baseScale, pinchScale, lastOffsetX, lastOffsetY, translateX, translateY, lastScale, isZoomedIn])

  const handlePanOutside = useCallback(() => {
    const { width, height } = getContentContainerSize()
    const maxOffset = {
      x: width * lastScale.value < containerWidth ? 0 : ((width * lastScale.value - containerWidth) / 2) / lastScale.value,
      y: height * lastScale.value < containerHeight ? 0 : ((height * lastScale.value - containerHeight) / 2) / lastScale.value,
    }

    const isPanedXOutside = lastOffsetX.value > maxOffset.x || lastOffsetX.value < -maxOffset.x
    if (isPanedXOutside) {
      const newOffsetX = lastOffsetX.value >= 0 ? maxOffset.x : -maxOffset.x
      lastOffsetX.value = newOffsetX

      translateX.value = withSpring(newOffsetX)
    } else {
      translateX.value = lastOffsetX.value
    }

    const isPanedYOutside = lastOffsetY.value > maxOffset.y || lastOffsetY.value < -maxOffset.y
    if (isPanedYOutside) {
      const newOffsetY = lastOffsetY.value >= 0 ? maxOffset.y : -maxOffset.y
      lastOffsetY.value = newOffsetY

      translateY.value = withSpring(newOffsetY)
    } else {
      translateY.value = lastOffsetY.value
    }
  }, [containerWidth, containerHeight, getContentContainerSize, lastOffsetX, lastOffsetY, lastScale, translateX, translateY])

  const onDoubleTap = useCallback(() => {
    if (isZoomedIn.value)
      zoomOut()
    else
      zoomIn()
  }, [zoomIn, zoomOut, isZoomedIn])

  const onLayout = useCallback(({ nativeEvent: { layout: { width, height } } }) => {
    setContainerWidth(width)
    setContainerHeight(height)
  }, [])

  const onLayoutContent = useCallback(({ nativeEvent: { layout: { width, height } } }) => {
    setContainerDimensions({ width, height })
  }, [])

  const onPinchEnd = useCallback(scale => {
    const newScale = lastScale.value * scale
    lastScale.value = newScale
    if (newScale > 1) {
      isZoomedIn.value = true
      baseScale.value = newScale
      pinchScale.value = 1

      handlePanOutside()
      setPanGestureEnabled(true)
    } else {
      zoomOut()
    }
  }, [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut, isZoomedIn])

  const zoomGestures = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(onDoubleTap)()
      })

    const panGesture = Gesture.Pan()
      .onUpdate(({ translationX, translationY }) => {
        translateX.value = lastOffsetX.value + translationX / lastScale.value
        translateY.value = lastOffsetY.value + translationY / lastScale.value
      })
      .onEnd(({ translationX, translationY }) => {
        lastOffsetX.value += translationX / lastScale.value
        lastOffsetY.value += translationY / lastScale.value
        runOnJS(handlePanOutside)()
      })
      .minDistance(0)
      .minPointers(1)
      .maxPointers(2)
      .enabled(panGestureEnabled)

    const pinchGesture = Gesture.Pinch()
      .onUpdate(({ scale }) => {
        pinchScale.value = scale
      })
      .onEnd(({ scale }) => {
        pinchScale.value = scale

        runOnJS(onPinchEnd)(scale)
      })

    return Gesture.Simultaneous(tapGesture, Gesture.Simultaneous(pinchGesture, panGesture))
  }, [handlePanOutside, lastOffsetX, lastOffsetY, onDoubleTap, onPinchEnd, panGestureEnabled, pinchScale, translateX, translateY, lastScale])

  const animContentContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return (
    <GestureDetector gesture={zoomGestures}>
      <View
        style={[styles.container, style]}
        onLayout={onLayout}
        collapsable={false}
      >
        <Animated.View
          style={[animContentContainerStyle, contentContainerStyle]}
          onLayout={onLayoutContent}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

Zoom.propTypes = {
  children: PropTypes.any,
  style: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.number,
    PropTypes.bool,
  ]),
  contentContainerStyle: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.number,
    PropTypes.bool,
  ]),
}

export default Zoom

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
})
