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
  TAP_MAX_DELTA,
  DOUBLE_TAP_SCALE,
} from './constants' // Allow over-zoom by 50%
import { clamp, type Dimensions } from './utils'
import styles from './styles'

// Rubber band factor for over-scroll/over-zoom
const RUBBER_BAND_FACTOR = 0.55
const MIN_OVER_SCALE = 0.5 // Allow zooming out to 50% for rubber band

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
  /**
   * Minimum allowed zoom scale. Default is 1.
   * Set to 1 to prevent zooming out smaller than initial size.
   * Set to a value < 1 to allow zooming out (e.g., 0.5 for 50%).
   */
  minScale?: number
  /**
   * Maximum allowed zoom scale. Default is 4 (MAX_SCALE constant).
   */
  maxScale?: number
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
    minScale = 1,
    maxScale = MAX_SCALE,
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
  const isPinching = useSharedValue(false)

  // Pan gesture state for rubber band effect
  const isPanning = useSharedValue(false)

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
   * Apply rubber band effect to a value that's outside bounds
   * Apple Photos uses this for smooth over-scroll feeling
   */
  const rubberBand = useCallback((
    value: number,
    min: number,
    max: number,
    dimension: number
  ): number => {
    'worklet'
    if (value < min) {
      const overscroll = min - value
      return min - (1 - (1 / ((overscroll * RUBBER_BAND_FACTOR / dimension) + 1))) * dimension
    }
    if (value > max) {
      const overscroll = value - max
      return max + (1 - (1 / ((overscroll * RUBBER_BAND_FACTOR / dimension) + 1))) * dimension
    }
    return value
  }, [])

  /**
   * Apply rubber band to translation during gesture
   */
  const applyRubberBandTranslation = useCallback((
    tx: number,
    ty: number,
    currentScale: number
  ): { x: number; y: number } => {
    'worklet'
    const container = containerDimensions.value
    const bounds = getTranslateBounds(currentScale)

    return {
      x: rubberBand(tx, -bounds.maxX, bounds.maxX, container.width),
      y: rubberBand(ty, -bounds.maxY, bounds.maxY, container.height),
    }
  }, [containerDimensions, getTranslateBounds, rubberBand])

  /**
   * Apply boundary constraints with spring animation (rubber band effect)
   */
  const applyBoundaryConstraints = useCallback((
    targetScale: number,
    animate: boolean = true
  ): void => {
    'worklet'

    const clampedScale = clamp(targetScale, minScale, maxScale)
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

    isZoomedIn.value = clampedScale > minScale
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    isZoomedIn,
    clampTranslation,
    minScale,
    maxScale,
  ])

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
      doubleTapConfig?.minZoomScale ?? minScale,
      doubleTapConfig?.maxZoomScale ?? maxScale
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
    minScale,
    maxScale,
  ])

  /**
   * Zoom out to minimum scale
   */
  const zoomOut = useCallback((): void => {
    'worklet'

    scale.value = withAnimation(minScale)
    translateX.value = withAnimation(0)
    translateY.value = withAnimation(0)

    savedScale.value = minScale
    savedTranslateX.value = 0
    savedTranslateY.value = 0

    isZoomedIn.value = false
  }, [scale, translateX, translateY, savedScale, savedTranslateX, savedTranslateY, isZoomedIn, withAnimation, minScale])

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
    // Apple Photos: 1 finger when zoomed in, 2 fingers when at 1x
    const panGesture = Gesture.Pan()
      .onStart(() => {
        'worklet'
        updateZoomGestureLastTime()
        isPanning.value = true
        // Save current position
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value
      })
      .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        'worklet'

        // Calculate new translation
        const newTx = savedTranslateX.value + event.translationX
        const newTy = savedTranslateY.value + event.translationY

        // Apply rubber band effect during pan (Apple Photos behavior)
        const rubber = applyRubberBandTranslation(newTx, newTy, scale.value)
        translateX.value = rubber.x
        translateY.value = rubber.y
      })
      .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        updateZoomGestureLastTime()
        isPanning.value = false

        const currentScale = scale.value
        const bounds = getTranslateBounds(currentScale)

        // Check if we're outside bounds
        const currentTx = translateX.value
        const currentTy = translateY.value
        const isOutOfBoundsX = currentTx < -bounds.maxX || currentTx > bounds.maxX
        const isOutOfBoundsY = currentTy < -bounds.maxY || currentTy > bounds.maxY

        if (isOutOfBoundsX || isOutOfBoundsY) {
          // Spring back to bounds (no momentum)
          const springConfig = {
            damping: 20,
            stiffness: 300,
            mass: 0.5,
          }
          translateX.value = withSpring(
            clamp(currentTx, -bounds.maxX, bounds.maxX),
            springConfig
          )
          translateY.value = withSpring(
            clamp(currentTy, -bounds.maxY, bounds.maxY),
            springConfig
          )
        }
        else {
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
        }

        // Update saved values
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
        // Apple Photos behavior:
        // - 1 finger pan when zoomed in
        // - 2 finger pan always works (for pinch-pan combo)
        if (([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state)) {
          const zoomed = scale.value > minScale + 0.01 // Small threshold to avoid float issues
          if (zoomed || e.numberOfTouches === 2)
            state.activate()
          else
            state.fail()
        }
      })
      .minDistance(0)
      .minPointers(1)
      .maxPointers(2)

    // ========== PINCH GESTURE ==========
    // Apple Photos: dynamic focal point tracking during pinch
    const pinchGesture = Gesture.Pinch()
      .onStart((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'
        updateZoomGestureLastTime()
        isPinching.value = true

        // Save current state
        savedScale.value = scale.value
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value

        // Save initial focal point
        pinchFocalX.value = event.focalX
        pinchFocalY.value = event.focalY
      })
      .onUpdate((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'

        const container = containerDimensions.value
        const centerX = container.width / 2
        const centerY = container.height / 2

        // New scale with rubber band limits
        let newScale = savedScale.value * event.scale
        // Apply rubber band to scale
        if (newScale < minScale) {
          // Rubber band for zoom out below minScale
          const overZoom = minScale - newScale
          newScale = minScale - overZoom * RUBBER_BAND_FACTOR
          newScale = Math.max(newScale, minScale * MIN_OVER_SCALE)
        }
        else if (newScale > maxScale) {
          // Rubber band for zoom in above max
          const overZoom = newScale - maxScale
          newScale = maxScale + overZoom * RUBBER_BAND_FACTOR
          newScale = Math.min(newScale, maxScale * 1.5)
        }

        // Dynamic focal point - Apple Photos updates focal point during gesture
        // This makes the gesture feel more natural when fingers move
        const currentFocalX = event.focalX
        const currentFocalY = event.focalY

        // Blend between initial and current focal point
        // This creates smoother behavior than pure dynamic tracking
        const focalBlend = 0.3 // 30% tracking of finger movement
        const effectiveFocalX = pinchFocalX.value + (currentFocalX - pinchFocalX.value) * focalBlend
        const effectiveFocalY = pinchFocalY.value + (currentFocalY - pinchFocalY.value) * focalBlend

        // Focal point offset from container center
        const focalOffsetX = effectiveFocalX - centerX
        const focalOffsetY = effectiveFocalY - centerY

        // Apple Photos focal point algorithm
        const scaleRatio = newScale / savedScale.value
        const newTx = focalOffsetX * (1 - scaleRatio) + savedTranslateX.value * scaleRatio
        const newTy = focalOffsetY * (1 - scaleRatio) + savedTranslateY.value * scaleRatio

        // Apply directly (rubber band already applied to scale)
        scale.value = newScale
        translateX.value = newTx
        translateY.value = newTy
      })
      .onEnd(() => {
        'worklet'
        updateZoomGestureLastTime()
        isPinching.value = false

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
    isPinching,
    isPanning,
    getTranslateBounds,
    applyBoundaryConstraints,
    applyRubberBandTranslation,
    minScale,
    maxScale,
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
  /**
   * Minimum allowed zoom scale. Default is 1.
   * Set to 1 to prevent zooming out smaller than initial size (fixes #29).
   * Set to a value < 1 to allow zooming out (e.g., 0.5 for 50%).
   */
  minScale?: number
  /**
   * Maximum allowed zoom scale. Default is 4.
   */
  maxScale?: number

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
