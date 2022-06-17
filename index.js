import React, { useState, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'

function Zoom ({ style, contentContainerStyle, children }) {
  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useRef(1)
  const isZoomedIn = useRef(false)
  const [panGestureEnabled, setPanGestureEnabled] = useState(false)

  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentDimensions, setContainerDimensions] = useState(() => ({ width: 1, height: 1 }))

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffset = useRef({
    x: 0,
    y: 0,
  }).current

  const zoomOut = useCallback(() => {
    lastScale.current = 1
    baseScale.value = withSpring(lastScale.current)
    pinchScale.value = withSpring(1)

    lastOffset.x = 0
    lastOffset.y = 0

    translateX.value = withSpring(lastOffset.x)
    translateY.value = withSpring(lastOffset.y)

    isZoomedIn.current = false

    setPanGestureEnabled(false)
  }, [baseScale, pinchScale, lastOffset, translateX, translateY])

  const getContentContainerSize = useCallback(() => {
    return ({
      width: containerWidth,
      height: contentDimensions.height * containerWidth / contentDimensions.width,
    })
  }, [contentDimensions, containerWidth])

  const zoomIn = useCallback(() => {
    const { width, height } = getContentContainerSize()

    // TODO: MAKE SMARTER CHOISE BASED ON AVAILABLE FREE VERTICAL SPACE
    lastScale.current = width > height ? width / height * 0.8 : height / width * 0.8
    if (lastScale.current < 1.4)
      lastScale.current = 1.4
    else if (lastScale.current > 1.5)
      lastScale.current = 1.5

    baseScale.value = withSpring(lastScale.current)
    pinchScale.value = withSpring(1)

    lastOffset.x = 0
    lastOffset.y = 0

    translateX.value = lastOffset.x
    translateY.value = lastOffset.y

    isZoomedIn.current = true
    setPanGestureEnabled(true)
  }, [baseScale, pinchScale, getContentContainerSize, lastOffset, translateX, translateY])

  const handlePanOutside = useCallback(() => {
    const { width, height } = getContentContainerSize()
    const maxOffset = {
      x: width * lastScale.current < containerWidth ? 0 : ((width * lastScale.current - containerWidth) / 2) / lastScale.current,
      y: height * lastScale.current < containerHeight ? 0 : ((height * lastScale.current - containerHeight) / 2) / lastScale.current,
    }

    const isPanedXOutside = lastOffset.x > maxOffset.x || lastOffset.x < -maxOffset.x
    if (isPanedXOutside) {
      lastOffset.x = lastOffset.x > 0 ? maxOffset.x : -maxOffset.x

      translateX.value = withSpring(lastOffset.x)
    } else {
      translateX.value = lastOffset.x
    }

    const isPanedYOutside = lastOffset.y > maxOffset.y || lastOffset.y < -maxOffset.y
    if (isPanedYOutside) {
      lastOffset.y = lastOffset.y > 0 ? maxOffset.y : -maxOffset.y

      translateY.value = withSpring(lastOffset.y)
    } else {
      translateY.value = lastOffset.y
    }
  }, [containerWidth, containerHeight, getContentContainerSize, lastOffset, translateX, translateY])

  const onDoubleTap = useCallback(() => {
    if (isZoomedIn.current)
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

  const animContentContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  const onPinchEnd = useCallback(scale => {
    lastScale.current *= scale
    if (lastScale.current > 1) {
      isZoomedIn.current = true
      baseScale.value = lastScale.current
      pinchScale.value = 1

      handlePanOutside()
      setPanGestureEnabled(true)
    } else {
      zoomOut()
    }
  }, [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut])

  const zoomGestures = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(onDoubleTap)()
      })

    const panGesture = Gesture.Pan()
      .onUpdate(({ translationX, translationY }) => {
        translateX.value = lastOffset.x + translationX / lastScale.current
        translateY.value = lastOffset.y + translationY / lastScale.current
      })
      .onEnd(({ translationX, translationY }) => {
        lastOffset.x += translationX / lastScale.current
        lastOffset.y += translationY / lastScale.current
        runOnJS(handlePanOutside)()
      })
      .minDistance(0)
      .minPointers(panGestureEnabled ? 1 : 0)
      .maxPointers(panGestureEnabled ? 1 : 0)

    let pinchGesture = Gesture.Pinch()
      .onUpdate(({ scale }) => {
        pinchScale.value = scale
      })
      .onEnd(({ scale }) => {
        pinchScale.value = scale

        runOnJS(onPinchEnd)(scale)
      })
    if (pinchGesture.minPointers)
      pinchGesture = pinchGesture.minPointers(2)
    if (pinchGesture.maxPointers)
      pinchGesture = pinchGesture.maxPointers(2)

    return Gesture.Race(tapGesture, Gesture.Simultaneous(pinchGesture, panGesture))
  }, [handlePanOutside, lastOffset, onDoubleTap, onPinchEnd, panGestureEnabled, pinchScale, translateX, translateY])

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
