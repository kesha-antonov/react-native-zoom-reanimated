import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'

function Zoom ({
  style,
  contentContainerStyle,
  children,
  animationFunction = withSpring,
  animationConfig,
}) {
  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useSharedValue(1)
  const isZoomedIn = useSharedValue(false)
  const isPanGestureEnabled = useSharedValue(false)

  const containerDimensions = useSharedValue({ width: 0, height: 0 })
  const contentDimensions = useSharedValue({ width: 1, height: 1 })

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffsetX = useSharedValue(0)
  const lastOffsetY = useSharedValue(0)

  const withAnimation = useCallback((toValue, config) => {
    'worklet'

    return animationFunction(toValue, {
      ...animationConfig,
      ...config,
    })
  }, [animationFunction, animationConfig])

  const getContentContainerSize = useCallback(() => {
    return ({
      width: containerDimensions.value.width,
      height: contentDimensions.value.height * containerDimensions.value.width / contentDimensions.value.width,
    })
  }, [containerDimensions])

  const zoomIn = useCallback(() => {
    const { width, height } = getContentContainerSize()

    // TODO: MAKE SMARTER CHOISE BASED ON AVAILABLE FREE VERTICAL SPACE
    let newScale = width > height ? width / height * 0.8 : height / width * 0.8
    if (newScale < 1.4)
      newScale = 1.4
    else if (newScale > 1.5)
      newScale = 1.5

    lastScale.value = newScale

    baseScale.value = withAnimation(newScale)
    pinchScale.value = withAnimation(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = newOffsetX
    translateY.value = newOffsetY

    isZoomedIn.value = true
    isPanGestureEnabled.value = true
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    isZoomedIn,
    lastScale,
    getContentContainerSize,
    isPanGestureEnabled,
  ])

  const zoomOut = useCallback(() => {
    const newScale = 1
    lastScale.value = newScale
    baseScale.value = withAnimation(newScale)
    pinchScale.value = withAnimation(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = withAnimation(newOffsetX)
    translateY.value = withAnimation(newOffsetY)

    isZoomedIn.value = false

    isPanGestureEnabled.value = false
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
    isPanGestureEnabled,
  ])

  const handlePanOutside = useCallback(() => {
    const { width, height } = getContentContainerSize()
    const maxOffset = {
      x: width * lastScale.value < containerDimensions.value.width ? 0 : ((width * lastScale.value - containerDimensions.value.width) / 2) / lastScale.value,
      y: height * lastScale.value < containerDimensions.value.height ? 0 : ((height * lastScale.value - containerDimensions.value.height) / 2) / lastScale.value,
    }

    const isPanedXOutside = lastOffsetX.value > maxOffset.x || lastOffsetX.value < -maxOffset.x
    if (isPanedXOutside) {
      const newOffsetX = lastOffsetX.value >= 0 ? maxOffset.x : -maxOffset.x
      lastOffsetX.value = newOffsetX

      translateX.value = withAnimation(newOffsetX)
    } else {
      translateX.value = lastOffsetX.value
    }

    const isPanedYOutside = lastOffsetY.value > maxOffset.y || lastOffsetY.value < -maxOffset.y
    if (isPanedYOutside) {
      const newOffsetY = lastOffsetY.value >= 0 ? maxOffset.y : -maxOffset.y
      lastOffsetY.value = newOffsetY

      translateY.value = withAnimation(newOffsetY)
    } else {
      translateY.value = lastOffsetY.value
    }
  }, [
    lastOffsetX,
    lastOffsetY,
    lastScale,
    translateX,
    translateY,
    containerDimensions,
    getContentContainerSize,
  ])

  const onDoubleTap = useCallback(() => {
    if (isZoomedIn.value)
      zoomOut()
    else
      zoomIn()
  }, [zoomIn, zoomOut, isZoomedIn])

  const onLayout = useCallback(({ nativeEvent: { layout: { width, height } } }) => {
    containerDimensions.value = {
      width,
      height,
    }
  }, [containerDimensions])

  const onLayoutContent = useCallback(({ nativeEvent: { layout: { width, height } } }) => {
    contentDimensions.value = {
      width,
      height,
    }
  }, [contentDimensions])

  const onPinchEnd = useCallback(scale => {
    const newScale = lastScale.value * scale
    lastScale.value = newScale
    if (newScale > 1) {
      isZoomedIn.value = true
      baseScale.value = newScale
      pinchScale.value = 1

      handlePanOutside()
      isPanGestureEnabled.value = true
    } else {
      zoomOut()
    }
  }, [
    lastScale,
    baseScale,
    pinchScale,
    handlePanOutside,
    zoomOut,
    isZoomedIn,
    isPanGestureEnabled,
  ])

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
      .onTouchesMove((e, state) => {
        if (isPanGestureEnabled.value || e.numberOfTouches === 2)
          state.activate()
        else
          state.fail()
      })
      .minDistance(0)
      .minPointers(2)
      .maxPointers(2)

    const pinchGesture = Gesture.Pinch()
      .onUpdate(({ scale }) => {
        pinchScale.value = scale
        isPanGestureEnabled.value = true
      })
      .onEnd(({ scale }) => {
        pinchScale.value = scale

        runOnJS(onPinchEnd)(scale)
      })

    return Gesture.Race(
      Gesture.Simultaneous(pinchGesture, panGesture),
      tapGesture
    )
  }, [
    handlePanOutside,
    lastOffsetX,
    lastOffsetY,
    onDoubleTap,
    onPinchEnd,
    isPanGestureEnabled,
    pinchScale,
    translateX,
    translateY,
    lastScale,
  ])

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
  animationFunction: PropTypes.func,
  animationConfig: PropTypes.object,
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
