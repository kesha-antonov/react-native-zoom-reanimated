import React, { PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import {
  LayoutChangeEvent,
  StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {
  ComposedGesture,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureStateChangeEvent,
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  State,
} from 'react-native-gesture-handler'
import type {
  GestureStateManagerType,
} from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager'
import Animated, {
  AnimatableValue,
  AnimationCallback,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import {
  ANIMATION_DURATION,
  MAX_SCALE,
  MIN_SCALE,
  MIN_PAN_POINTERS,
  MAX_PAN_POINTERS,
  PAN_DEBOUNCE_MS,
  TAP_MAX_DELTA,
} from './constants'
import {
  calculateMaxOffset,
  getScaleFromDimensions,
  resetOffsets,
  type Dimensions,
  type Offset,
  clamp,
} from './utils'

import styles from './styles'

/**
 * Animation configuration type
 */
export type AnimationConfigProps = Parameters<typeof withTiming>[1]

/**
 * Double tap configuration
 */
export interface DoubleTapConfig {
  defaultScale?: number
  minZoomScale?: number
  maxZoomScale?: number
}

/**
 * Hook props for useZoomGesture
 */
export interface UseZoomGestureProps {
  animationFunction?: typeof withTiming
  animationConfig?: AnimationConfigProps
  doubleTapConfig?: DoubleTapConfig
}

/**
 * Return type for useZoomGesture hook
 */
export interface UseZoomGestureReturn {
  zoomGesture: ComposedGesture
  contentContainerAnimatedStyle: ReturnType<typeof useAnimatedStyle>
  onLayout: (event: LayoutChangeEvent) => void
  onLayoutContent: (event: LayoutChangeEvent) => void
  zoomOut: () => void
  isZoomedIn: SharedValue<boolean>
  zoomGestureLastTime: SharedValue<number>
}

/**
 * Custom hook for zoom gesture handling with pan, pinch, and double-tap support
 * @param props - Configuration options for zoom behavior
 * @returns Gesture handlers and animated styles
 */
export function useZoomGesture(props: UseZoomGestureProps = {}): UseZoomGestureReturn {
  const {
    animationFunction = withTiming,
    animationConfig,
    doubleTapConfig,
  } = props

  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useSharedValue(1)
  const isZoomedIn = useSharedValue(false)
  const zoomGestureLastTime = useSharedValue(0)

  const containerDimensions = useSharedValue<Dimensions>({ width: 0, height: 0 })
  const contentDimensions = useSharedValue<Dimensions>({ width: 1, height: 1 })

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffsetX = useSharedValue(0)
  const lastOffsetY = useSharedValue(0)
  const panStartOffsetX = useSharedValue(0)
  const panStartOffsetY = useSharedValue(0)
  const velocity = useSharedValue<Offset>({ x: 0, y: 0 })

  const handlePanOutsideTimeoutId: React.MutableRefObject<
    NodeJS.Timeout | number | undefined
  > = useRef(undefined)

  const withAnimation = useCallback(
    (toValue: number, config?: AnimationConfigProps) => {
      'worklet'

      return animationFunction(toValue, {
        duration: ANIMATION_DURATION,
        ...config,
        ...animationConfig,
      })
    },
    [animationFunction, animationConfig]
  )

  const getContentContainerSize = useCallback((): Dimensions => {
    'worklet'

    const { width: containerWidth } = containerDimensions.value
    const { width: contentWidth, height: contentHeight } = contentDimensions.value

    // Guard against division by zero
    if (contentWidth <= 0)
      return { width: containerWidth, height: 0 }

    return {
      width: containerWidth,
      height: (contentHeight * containerWidth) / contentWidth,
    }
  }, [containerDimensions, contentDimensions])

  const zoomIn = useCallback((): void => {
    'worklet'

    const { width, height } = getContentContainerSize()

    const newScale
      = doubleTapConfig?.defaultScale ?? getScaleFromDimensions(width, height)

    const clampedScale = clamp(
      newScale,
      doubleTapConfig?.minZoomScale ?? MIN_SCALE,
      doubleTapConfig?.maxZoomScale ?? MAX_SCALE
    )

    lastScale.value = clampedScale

    baseScale.value = withAnimation(clampedScale)
    pinchScale.value = withAnimation(1)

    resetOffsets(lastOffsetX, lastOffsetY, translateX, translateY)

    isZoomedIn.value = true
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
    withAnimation,
    doubleTapConfig,
  ])

  const zoomOut = useCallback((): void => {
    'worklet'

    const newScale = 1
    lastScale.value = newScale

    baseScale.value = withAnimation(newScale)
    pinchScale.value = withAnimation(1)

    resetOffsets(lastOffsetX, lastOffsetY, translateX, translateY, withAnimation)

    isZoomedIn.value = false
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
    withAnimation,
  ])

  const handlePanOutside = useCallback((): void => {
    'worklet'

    if (handlePanOutsideTimeoutId.current !== undefined)
      globalThis.clearTimeout(handlePanOutsideTimeoutId.current)

    handlePanOutsideTimeoutId.current = globalThis.setTimeout((): void => {
      const { width, height } = getContentContainerSize()

      const maxOffset = calculateMaxOffset(
        { width, height },
        containerDimensions.value,
        lastScale.value
      )

      const decayConfig = {
        rubberBandEffect: true,
      }

      translateX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffset.x, maxOffset.x],
        ...decayConfig,
      })
      translateY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffset.y, maxOffset.y],
        ...decayConfig,
      })

      lastOffsetX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffset.x, maxOffset.x],
        ...decayConfig,
      })
      lastOffsetY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffset.y, maxOffset.y],
        ...decayConfig,
      })
    }, PAN_DEBOUNCE_MS)
  }, [
    lastOffsetX,
    lastOffsetY,
    lastScale,
    translateX,
    translateY,
    containerDimensions,
    getContentContainerSize,
    velocity,
  ])

  const onDoubleTap = useCallback((): void => {
    'worklet'

    if (isZoomedIn.value) zoomOut()
    else zoomIn()
  }, [zoomIn, zoomOut, isZoomedIn])

  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent): void => {
      containerDimensions.value = {
        width,
        height,
      }
    },
    [containerDimensions]
  )

  const onLayoutContent = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent): void => {
      contentDimensions.value = {
        width,
        height,
      }
    },
    [contentDimensions]
  )

  const onPinchEnd = useCallback(
    (scale: number): void => {
      'worklet'

      const newScale = clamp(lastScale.value * scale, MIN_SCALE, MAX_SCALE)
      lastScale.value = newScale
      if (newScale > 1) {
        isZoomedIn.value = true
        baseScale.value = newScale
        pinchScale.value = 1

        runOnJS(handlePanOutside)()
      }
      else {
        zoomOut()
      }
    },
    [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut, isZoomedIn]
  )

  const updateZoomGestureLastTime = useCallback((): void => {
    'worklet'

    zoomGestureLastTime.value = Date.now()
  }, [zoomGestureLastTime])

  const zoomGesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        'worklet'
        updateZoomGestureLastTime()

        runOnJS(() => onDoubleTap())()
      })
      .maxDeltaX(TAP_MAX_DELTA)
      .maxDeltaY(TAP_MAX_DELTA)

    const panGesture = Gesture.Pan()
      .onStart(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          'worklet'
          updateZoomGestureLastTime()

          const { translationX, translationY } = event

          panStartOffsetX.value = translationX
          panStartOffsetY.value = translationY
        }
      )
      .onUpdate(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          'worklet'

          let { translationX, translationY } = event

          translationX -= panStartOffsetX.value
          translationY -= panStartOffsetY.value

          translateX.value
            = lastOffsetX.value
              + translationX / lastScale.value
          translateY.value
            = lastOffsetY.value
              + translationY / lastScale.value
        }
      )
      .onEnd(
        (
          event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
        ): void => {
          'worklet'
          updateZoomGestureLastTime()

          let { translationX, translationY } = event

          translationX -= panStartOffsetX.value
          translationY -= panStartOffsetY.value

          // Save the ending pan velocity for withDecay
          const { velocityX, velocityY } = event
          velocity.value = {
            x: velocityX / lastScale.value,
            y: velocityY / lastScale.value,
          }

          // SAVES LAST POSITION
          lastOffsetX.value
            = lastOffsetX.value + translationX / lastScale.value
          lastOffsetY.value
            = lastOffsetY.value + translationY / lastScale.value

          runOnJS(() => handlePanOutside())()
        }
      )
      .onTouchesMove(
        (e: GestureTouchEvent, state: GestureStateManagerType): void => {
          'worklet'
          if (([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state))
            if (isZoomedIn.value || e.numberOfTouches === 2) state.activate()
            else state.fail()
        }
      )
      .onFinalize(() => {
        'worklet'
      })
      .minDistance(0)
      .minPointers(MIN_PAN_POINTERS)
      .maxPointers(MAX_PAN_POINTERS)

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        'worklet'
        updateZoomGestureLastTime()
      })
      .onUpdate(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          'worklet'

          pinchScale.value = scale
        }
      )
      .onEnd(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          'worklet'
          updateZoomGestureLastTime()

          pinchScale.value = scale

          runOnJS(() => onPinchEnd(scale))()
        }
      )
      .onFinalize(() => {
        'worklet'
      })

    return Gesture.Simultaneous(tapGesture, panGesture, pinchGesture)
  }, [
    handlePanOutside,
    lastOffsetX,
    lastOffsetY,
    onDoubleTap,
    onPinchEnd,
    pinchScale,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
    panStartOffsetX,
    panStartOffsetY,
    updateZoomGestureLastTime,
    velocity,
  ])

  const contentContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout: (event: LayoutChangeEvent): void => onLayout(event),
    onLayoutContent: (event: LayoutChangeEvent): void => onLayoutContent(event),
    zoomOut: (): void => zoomOut(),
    isZoomedIn,
    zoomGestureLastTime,
  }
}

/**
 * Props for the Zoom component
 */
export interface ZoomProps {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  animationConfig?: AnimationConfigProps
  doubleTapConfig?: DoubleTapConfig

  animationFunction?: <T extends AnimatableValue>(
    toValue: T,
    userConfig?: AnimationConfigProps,
    callback?: AnimationCallback
  ) => T
}

/**
 * Zoom component that provides pinch, pan, and double-tap gestures for zooming content
 *
 * @example
 * ```tsx
 * <Zoom
 *   doubleTapConfig={{
 *     defaultScale: 2,
 *     minZoomScale: 1,
 *     maxZoomScale: 5,
 *   }}
 * >
 *   <Image source={{ uri: 'https://example.com/image.jpg' }} />
 * </Zoom>
 * ```
 *
 * @param props - Component props including children and zoom configuration
 * @returns A zoomable container component
 */
export default function Zoom(
  props: PropsWithChildren<ZoomProps>
): React.JSX.Element {
  const { style, contentContainerStyle, children, ...rest } = props

  const {
    zoomGesture,
    onLayout,
    onLayoutContent,
    contentContainerAnimatedStyle,
  } = useZoomGesture({
    ...rest,
  })

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={zoomGesture}>
        <View
          style={[styles.container, style]}
          onLayout={onLayout}
          collapsable={false}
        >
          <Animated.View
            style={[contentContainerAnimatedStyle, contentContainerStyle]}
            onLayout={onLayoutContent}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}
