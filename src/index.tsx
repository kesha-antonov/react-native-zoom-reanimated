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
  useDerivedValue,
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

// Module-level log function for safe worklet-to-JS logging
const log = (message: string): void => {
  console.log(message)
}

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

  // Pinch focal point tracking
  const pinchFocalX = useSharedValue(0)
  const pinchFocalY = useSharedValue(0)
  const pinchStartScale = useSharedValue(1)
  const pinchStartTranslateX = useSharedValue(0)
  const pinchStartTranslateY = useSharedValue(0)

  const handlePanOutsideTimeoutId: React.MutableRefObject<
    NodeJS.Timeout | number | undefined
  > = useRef(undefined)

  // DEBUG: Log scale values on every change
  useDerivedValue(() => {
    const visualScale = baseScale.value * pinchScale.value
    runOnJS(log)(`[ZOOM DERIVED] baseScale=${baseScale.value.toFixed(3)} pinchScale=${pinchScale.value.toFixed(3)} lastScale=${lastScale.value.toFixed(3)} visualScale=${visualScale.toFixed(3)} isZoomedIn=${isZoomedIn.value}`)
    return visualScale
  }, [baseScale, pinchScale, lastScale, isZoomedIn])

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

  const zoomIn = useCallback((focalX?: number, focalY?: number): void => {
    'worklet'

    const { width, height } = getContentContainerSize()
    const container = containerDimensions.value

    const newScale
      = doubleTapConfig?.defaultScale ?? getScaleFromDimensions(width, height)

    const clampedScale = clamp(
      newScale,
      doubleTapConfig?.minZoomScale ?? MIN_SCALE,
      doubleTapConfig?.maxZoomScale ?? MAX_SCALE
    )

    // Current visual scale (should be 1 when zooming in from unzoomed state)
    const currentScale = baseScale.value * pinchScale.value

    lastScale.value = clampedScale

    // Calculate offset to zoom to tap point (Apple Photos style)
    // The tap point should stay stationary while zooming
    if (focalX !== undefined && focalY !== undefined && container.width > 0 && container.height > 0) {
      const centerX = container.width / 2
      const centerY = container.height / 2

      // Focal point relative to center
      const focalOffsetX = focalX - centerX
      const focalOffsetY = focalY - centerY

      // Current translate values
      const currentTranslateX = translateX.value
      const currentTranslateY = translateY.value

      // Apple Photos-style: keep focal point stationary
      // newTranslate = focalOffset * (1 - newScale/currentScale) + currentTranslate * newScale/currentScale
      const scaleRatio = clampedScale / currentScale
      let targetOffsetX = focalOffsetX * (1 - scaleRatio) + currentTranslateX * scaleRatio
      let targetOffsetY = focalOffsetY * (1 - scaleRatio) + currentTranslateY * scaleRatio

      // Calculate max allowed offsets to prevent showing empty space
      const maxOffset = calculateMaxOffset(
        { width, height },
        container,
        clampedScale
      )

      // Clamp offsets to valid range
      targetOffsetX = clamp(targetOffsetX, -maxOffset.x, maxOffset.x)
      targetOffsetY = clamp(targetOffsetY, -maxOffset.y, maxOffset.y)

      // Animate both scale and translate together for smooth zoom
      baseScale.value = withAnimation(clampedScale)
      pinchScale.value = 1
      translateX.value = withAnimation(targetOffsetX)
      translateY.value = withAnimation(targetOffsetY)
      lastOffsetX.value = targetOffsetX
      lastOffsetY.value = targetOffsetY
    } else {
      baseScale.value = withAnimation(clampedScale)
      pinchScale.value = withAnimation(1)
      resetOffsets(lastOffsetX, lastOffsetY, translateX, translateY)
    }

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
    containerDimensions,
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

  const applyPanDecay = useCallback((): void => {
    'worklet'

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

  const handlePanOutside = useCallback((): void => {
    if (handlePanOutsideTimeoutId.current !== undefined)
      clearTimeout(handlePanOutsideTimeoutId.current)

    handlePanOutsideTimeoutId.current = setTimeout((): void => {
      applyPanDecay()
    }, PAN_DEBOUNCE_MS)
  }, [applyPanDecay])

  const onDoubleTap = useCallback((x: number, y: number): void => {
    'worklet'

    if (isZoomedIn.value) zoomOut()
    else zoomIn(x, y)
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

      // Get the actual visual scale at the end of the gesture
      const currentVisualScale = baseScale.value * pinchScale.value
      // Clamp to valid range: 1 (unzoomed) to MAX_SCALE
      // Note: MIN_SCALE (1.4) is the minimum ZOOMED scale for double-tap, not for pinch
      const targetScale = clamp(currentVisualScale, 1, MAX_SCALE)

      // DEBUG: Log before any changes
      runOnJS(log)(`[ZOOM PINCH_END_BEFORE] baseScale=${baseScale.value.toFixed(3)} pinchScale=${pinchScale.value.toFixed(3)} lastScale=${lastScale.value.toFixed(3)} visualScale=${currentVisualScale.toFixed(3)} isZoomedIn=${isZoomedIn.value}`)

      // Commit current visual scale to baseScale, then reset pinchScale
      baseScale.value = currentVisualScale
      pinchScale.value = 1

      // DEBUG: Log after commit
      runOnJS(log)(`[ZOOM PINCH_END_AFTER_COMMIT] baseScale=${baseScale.value.toFixed(3)} pinchScale=${pinchScale.value.toFixed(3)} targetScale=${targetScale.toFixed(3)} willZoomOut=${targetScale <= 1}`)

      if (targetScale > 1) {
        // Stay zoomed in - animate to target scale
        lastScale.value = targetScale
        isZoomedIn.value = true
        baseScale.value = withAnimation(targetScale)
        applyPanDecay()
      }
      else {
        // Zoom out completely - animate back to scale 1
        lastScale.value = 1
        isZoomedIn.value = false
        baseScale.value = withAnimation(1)
        resetOffsets(lastOffsetX, lastOffsetY, translateX, translateY, withAnimation)
      }
    },
    [lastScale, baseScale, pinchScale, applyPanDecay, isZoomedIn, withAnimation, lastOffsetX, lastOffsetY, translateX, translateY]
  )

  const updateZoomGestureLastTime = useCallback((): void => {
    'worklet'

    zoomGestureLastTime.value = Date.now()
  }, [zoomGestureLastTime])

  const zoomGesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((event) => {
        'worklet'
        updateZoomGestureLastTime()

        onDoubleTap(event.x, event.y)
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

          runOnJS(handlePanOutside)()
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
      .onStart(
        (event: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          'worklet'
          updateZoomGestureLastTime()

          // Capture focal point and starting state for focal-point-based zoom
          pinchFocalX.value = event.focalX
          pinchFocalY.value = event.focalY
          pinchStartScale.value = baseScale.value * pinchScale.value // Current visual scale
          pinchStartTranslateX.value = translateX.value
          pinchStartTranslateY.value = translateY.value
        }
      )
      .onUpdate(
        (event: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          'worklet'

          // Calculate new visual scale
          const newVisualScale = pinchStartScale.value * event.scale
          pinchScale.value = newVisualScale / baseScale.value

          // Focal point relative to container center (in screen coordinates)
          const container = containerDimensions.value
          const centerX = container.width / 2
          const centerY = container.height / 2
          const focalOffsetX = pinchFocalX.value - centerX
          const focalOffsetY = pinchFocalY.value - centerY

          // Apple Photos-style focal point zoom algorithm:
          // To keep the point under finger stationary, we need to adjust translation
          // such that: focalPoint_screen = focalPoint_content * scale + translate
          //
          // At start: focalOffset = contentPoint * startScale + startTranslate
          // At now:   focalOffset = contentPoint * newScale + newTranslate
          //
          // Solving: contentPoint = (focalOffset - startTranslate) / startScale
          // Then:    newTranslate = focalOffset - contentPoint * newScale
          //        = focalOffset - (focalOffset - startTranslate) * newScale / startScale
          //        = focalOffset * (1 - newScale/startScale) + startTranslate * newScale/startScale
          //
          const scaleRatio = newVisualScale / pinchStartScale.value
          translateX.value = focalOffsetX * (1 - scaleRatio) + pinchStartTranslateX.value * scaleRatio
          translateY.value = focalOffsetY * (1 - scaleRatio) + pinchStartTranslateY.value * scaleRatio
        }
      )
      .onEnd(
        (event: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          'worklet'
          updateZoomGestureLastTime()

          pinchScale.value = event.scale

          // Update last offsets to current position
          lastOffsetX.value = translateX.value
          lastOffsetY.value = translateY.value

          onPinchEnd(event.scale)
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
    baseScale,
    containerDimensions,
    pinchFocalX,
    pinchFocalY,
    pinchStartScale,
    pinchStartTranslateX,
    pinchStartTranslateY,
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
    <GestureHandlerRootView style={[styles.container, style]}>
      <GestureDetector gesture={zoomGesture}>
        <View
          style={styles.container}
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
