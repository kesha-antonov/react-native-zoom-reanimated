import React, { PropsWithChildren, useCallback, useMemo } from 'react'
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
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  ANIMATION_DURATION,
  MAX_SCALE,
  MIN_PAN_POINTERS,
  MAX_PAN_POINTERS,
  TAP_MAX_DELTA,
  DOUBLE_TAP_SCALE,
} from './constants'
import { clamp, type Dimensions } from './utils'
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
 * Apple Photos-style zoom gesture hook
 *
 * Key principles from Apple Photos:
 * 1. Transform order: translate first, then scale (scale around center)
 * 2. Focal point stays under finger during pinch
 * 3. Rubber band effect when over-zooming or at boundaries
 * 4. Smooth spring animations for snap-back
 * 5. Momentum-based panning with boundary bounce
 */
export function useZoomGesture(props: UseZoomGestureProps = {}): UseZoomGestureReturn {
  const {
    animationFunction = withTiming,
    animationConfig,
    doubleTapConfig,
  } = props

  // ============== STATE ==============
  // Scale state - single source of truth
  const scale = useSharedValue(1)
  const savedScale = useSharedValue(1)

  // Translation state (in screen coordinates)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const savedTranslateX = useSharedValue(0)
  const savedTranslateY = useSharedValue(0)

  // Container and content dimensions
  const containerDimensions = useSharedValue<Dimensions>({ width: 0, height: 0 })
  const contentDimensions = useSharedValue<Dimensions>({ width: 1, height: 1 })

  // Pinch gesture state
  const pinchFocalX = useSharedValue(0)
  const pinchFocalY = useSharedValue(0)

  // Tracking state
  const isZoomedIn = useSharedValue(false)
  const zoomGestureLastTime = useSharedValue(0)

  // ============== HELPERS ==============

  const withAnimation = useCallback(
    (toValue: number, config?: AnimationConfigProps) => {
      'worklet'
      return animationFunction(toValue, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        ...config,
        ...animationConfig,
      })
    },
    [animationFunction, animationConfig]
  )

  /**
   * Get content size scaled to container width (aspect fit)
   */
  const getContentContainerSize = useCallback((): Dimensions => {
    'worklet'
    const { width: containerWidth, height: containerHeight } = containerDimensions.value
    const { width: contentWidth, height: contentHeight } = contentDimensions.value

    if (contentWidth <= 0 || contentHeight <= 0)
      return { width: containerWidth, height: containerHeight }

    const contentAspect = contentWidth / contentHeight
    const containerAspect = containerWidth / containerHeight

    if (contentAspect > containerAspect)
      // Content is wider - fit to width
      return {
        width: containerWidth,
        height: containerWidth / contentAspect,
      }

    else
      // Content is taller - fit to height
      return {
        width: containerHeight * contentAspect,
        height: containerHeight,
      }
  }, [containerDimensions, contentDimensions])

  /**
   * Calculate the maximum translation bounds for a given scale
   * This ensures the content edges don't go past the container edges
   */
  const getTranslateBounds = useCallback((currentScale: number): { maxX: number; maxY: number } => {
    'worklet'
    const container = containerDimensions.value
    const content = getContentContainerSize()

    const scaledWidth = content.width * currentScale
    const scaledHeight = content.height * currentScale

    // How much the scaled content exceeds the container
    const excessWidth = Math.max(0, scaledWidth - container.width)
    const excessHeight = Math.max(0, scaledHeight - container.height)

    return {
      maxX: excessWidth / 2,
      maxY: excessHeight / 2,
    }
  }, [containerDimensions, getContentContainerSize])

  /**
   * Clamp translation to valid bounds
   */
  const clampTranslation = useCallback((
    tx: number,
    ty: number,
    currentScale: number
  ): { x: number; y: number } => {
    'worklet'
    const bounds = getTranslateBounds(currentScale)
    return {
      x: clamp(tx, -bounds.maxX, bounds.maxX),
      y: clamp(ty, -bounds.maxY, bounds.maxY),
    }
  }, [getTranslateBounds])

  /**
   * Apply boundary constraints with spring animation (rubber band effect)
   */
  const applyBoundaryConstraints = useCallback((
    targetScale: number,
    animate: boolean = true
  ): void => {
    'worklet'

    const clampedScale = clamp(targetScale, 1, MAX_SCALE)
    const { x: clampedX, y: clampedY } = clampTranslation(
      translateX.value,
      translateY.value,
      clampedScale
    )

    if (animate) {
      // Apple uses spring animation for snap-back
      const springConfig = {
        damping: 20,
        stiffness: 300,
        mass: 0.5,
      }

      scale.value = withSpring(clampedScale, springConfig)
      translateX.value = withSpring(clampedX, springConfig)
      translateY.value = withSpring(clampedY, springConfig)
    }
    else {
      scale.value = clampedScale
      translateX.value = clampedX
      translateY.value = clampedY
    }

    savedScale.value = clampedScale
    savedTranslateX.value = clampedX
    savedTranslateY.value = clampedY

    isZoomedIn.value = clampedScale > 1
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY, isZoomedIn, clampTranslation])

  // ============== ZOOM ACTIONS ==============

  /**
   * Zoom in to a point (double-tap)
   * Apple Photos behavior: zoom to 2x (or configured scale) centered on tap point
   */
  const zoomIn = useCallback((focalX: number, focalY: number): void => {
    'worklet'

    const container = containerDimensions.value
    const targetScale = doubleTapConfig?.defaultScale
      ?? doubleTapConfig?.minZoomScale
      ?? DOUBLE_TAP_SCALE

    const clampedTargetScale = clamp(
      targetScale,
      doubleTapConfig?.minZoomScale ?? 1,
      doubleTapConfig?.maxZoomScale ?? MAX_SCALE
    )

    // Container center
    const centerX = container.width / 2
    const centerY = container.height / 2

    // Current state
    const currentScale = scale.value
    const currentTx = translateX.value
    const currentTy = translateY.value

    // Focal point offset from center (in screen coords)
    const focalOffsetX = focalX - centerX
    const focalOffsetY = focalY - centerY

    // Calculate new translation to keep focal point stationary
    // The focal point in content space: (focalOffset - translate) / scale
    // After zoom: newTranslate = focalOffset - contentPoint * newScale
    const contentPointX = (focalOffsetX - currentTx) / currentScale
    const contentPointY = (focalOffsetY - currentTy) / currentScale

    let newTx = focalOffsetX - contentPointX * clampedTargetScale
    let newTy = focalOffsetY - contentPointY * clampedTargetScale

    // Clamp to bounds
    const clamped = clampTranslation(newTx, newTy, clampedTargetScale)
    newTx = clamped.x
    newTy = clamped.y

    // Animate
    scale.value = withAnimation(clampedTargetScale)
    translateX.value = withAnimation(newTx)
    translateY.value = withAnimation(newTy)

    savedScale.value = clampedTargetScale
    savedTranslateX.value = newTx
    savedTranslateY.value = newTy

    isZoomedIn.value = true
  }, [
    containerDimensions,
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    isZoomedIn,
    doubleTapConfig,
    withAnimation,
    clampTranslation,
  ])

  /**
   * Zoom out to 1x scale
   */
  const zoomOut = useCallback((): void => {
    'worklet'

    scale.value = withAnimation(1)
    translateX.value = withAnimation(0)
    translateY.value = withAnimation(0)

    savedScale.value = 1
    savedTranslateX.value = 0
    savedTranslateY.value = 0

    isZoomedIn.value = false
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY, isZoomedIn, withAnimation])

  /**
   * Handle double tap
   */
  const onDoubleTap = useCallback((x: number, y: number): void => {
    'worklet'
    if (isZoomedIn.value)
      zoomOut()

    else
      zoomIn(x, y)
  }, [isZoomedIn, zoomIn, zoomOut])

  // ============== LAYOUT HANDLERS ==============

  const onLayout = useCallback(
    ({ nativeEvent: { layout: { width, height } } }: LayoutChangeEvent): void => {
      containerDimensions.value = { width, height }
    },
    [containerDimensions]
  )

  const onLayoutContent = useCallback(
    ({ nativeEvent: { layout: { width, height } } }: LayoutChangeEvent): void => {
      contentDimensions.value = { width, height }
    },
    [contentDimensions]
  )

  // ============== GESTURE HANDLERS ==============

  const updateZoomGestureLastTime = useCallback((): void => {
    'worklet'
    zoomGestureLastTime.value = Date.now()
  }, [zoomGestureLastTime])

  const zoomGesture = useMemo(() => {
    // ========== DOUBLE TAP ==========
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDeltaX(TAP_MAX_DELTA)
      .maxDeltaY(TAP_MAX_DELTA)
      .onEnd((event) => {
        'worklet'
        updateZoomGestureLastTime()
        onDoubleTap(event.x, event.y)
      })

    // ========== PAN GESTURE ==========
    const panGesture = Gesture.Pan()
      .onStart(() => {
        'worklet'
        updateZoomGestureLastTime()
        // Save current position
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value
      })
      .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        'worklet'

        // Pan in screen coordinates (not divided by scale - this is Apple's approach)
        // Content moves 1:1 with finger movement
        translateX.value = savedTranslateX.value + event.translationX
        translateY.value = savedTranslateY.value + event.translationY
      })
      .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        updateZoomGestureLastTime()

        const currentScale = scale.value
        const bounds = getTranslateBounds(currentScale)

        // Apply momentum with clamping (decay with rubber band)
        translateX.value = withDecay({
          velocity: event.velocityX,
          clamp: [-bounds.maxX, bounds.maxX],
          rubberBandEffect: true,
          rubberBandFactor: 0.6,
        })

        translateY.value = withDecay({
          velocity: event.velocityY,
          clamp: [-bounds.maxY, bounds.maxY],
          rubberBandEffect: true,
          rubberBandFactor: 0.6,
        })

        // Update saved values after decay settles
        savedTranslateX.value = clamp(
          savedTranslateX.value + event.translationX,
          -bounds.maxX,
          bounds.maxX
        )
        savedTranslateY.value = clamp(
          savedTranslateY.value + event.translationY,
          -bounds.maxY,
          bounds.maxY
        )
      })
      .onTouchesMove((e: GestureTouchEvent, state: GestureStateManagerType) => {
        'worklet'
        // Only allow pan when zoomed in, or with 2 fingers
        if (([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state))
          if (isZoomedIn.value || e.numberOfTouches === 2)
            state.activate()

          else
            state.fail()
      })
      .minDistance(0)
      .minPointers(MIN_PAN_POINTERS)
      .maxPointers(MAX_PAN_POINTERS)

    // ========== PINCH GESTURE ==========
    const pinchGesture = Gesture.Pinch()
      .onStart((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'
        updateZoomGestureLastTime()

        // Save current state
        savedScale.value = scale.value
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value

        // Save focal point
        pinchFocalX.value = event.focalX
        pinchFocalY.value = event.focalY
      })
      .onUpdate((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'

        const container = containerDimensions.value
        const centerX = container.width / 2
        const centerY = container.height / 2

        // New scale (allow over-zoom for rubber band effect)
        const newScale = savedScale.value * event.scale

        // Focal point offset from container center
        const focalOffsetX = pinchFocalX.value - centerX
        const focalOffsetY = pinchFocalY.value - centerY

        // Apple Photos focal point algorithm:
        // Keep the point under the focal point stationary
        //
        // Content point in original coordinates:
        // contentPoint = (focalOffset - savedTranslate) / savedScale
        //
        // New translation to keep this point under focal:
        // newTranslate = focalOffset - contentPoint * newScale
        //             = focalOffset - (focalOffset - savedTranslate) / savedScale * newScale
        //             = focalOffset * (1 - newScale/savedScale) + savedTranslate * newScale/savedScale

        const scaleRatio = newScale / savedScale.value
        const newTx = focalOffsetX * (1 - scaleRatio) + savedTranslateX.value * scaleRatio
        const newTy = focalOffsetY * (1 - scaleRatio) + savedTranslateY.value * scaleRatio

        // Apply directly (no clamping during gesture for rubber band)
        scale.value = newScale
        translateX.value = newTx
        translateY.value = newTy
      })
      .onEnd(() => {
        'worklet'
        updateZoomGestureLastTime()

        // Apply boundary constraints with spring animation
        applyBoundaryConstraints(scale.value, true)
      })

    return Gesture.Simultaneous(tapGesture, panGesture, pinchGesture)
  }, [
    updateZoomGestureLastTime,
    onDoubleTap,
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    pinchFocalX,
    pinchFocalY,
    containerDimensions,
    isZoomedIn,
    getTranslateBounds,
    applyBoundaryConstraints,
  ])

  // ============== ANIMATED STYLE ==============
  // Transform order: translate first, then scale
  // This means scale happens around the center after translation
  const contentContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut: () => {
      'worklet'
      zoomOut()
    },
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
 * Implements Apple Photos-style zoom behavior
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
  } = useZoomGesture({ ...rest })

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
