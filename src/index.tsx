import React, { PropsWithChildren, useCallback, useMemo, RefObject } from 'react'
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
  runOnJS,
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

// Apple Photos spring animation config
// Uses critically damped spring (dampingRatio ≈ 1) with fast response
// Reference: iOS UISpringTimingParameters defaults
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 250,
  mass: 0.5,
  overshootClamping: false,
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
 * Scrollable ref interface for parent FlatList/ScrollView.
 * Compatible with FlatList/ScrollView from react-native, react-native-gesture-handler,
 * and react-native-reanimated (Animated.FlatList/ScrollView).
 */
export interface ScrollableRef {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void
  scrollTo?: (params: { x?: number; y?: number; animated?: boolean }) => void
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
  /**
   * Callback fired when zoom state changes (zoomed in or out).
   * Called with true when zoomed in, false when zoomed out to initial scale.
   */
  onZoomStateChange?: (isZoomed: boolean) => void
  /**
   * Enable horizontal swipe to pass through to parent (e.g., FlatList) when at edge.
   * Apple Photos behavior: when zoomed and panning hits horizontal boundary,
   * continued swipe in same direction allows parent scroll to take over.
   * Default is false.
   */
  enableSwipeToClose?: boolean
  /**
   * Reference to parent FlatList/ScrollView for seamless edge scrolling.
   * When provided, enables Apple Photos-style continuous swipe:
   * zoomed image pans to edge, then seamlessly scrolls parent list.
   */
  parentScrollRef?: RefObject<ScrollableRef | null>
  /**
   * Current index in the parent list (for calculating scroll offset).
   * Required when using parentScrollRef.
   */
  currentIndex?: number
  /**
   * Width of each item in the parent list (for calculating scroll offset).
   * Required when using parentScrollRef. Usually equals device width.
   */
  itemWidth?: number
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
    onZoomStateChange,
    enableSwipeToClose = false,
    parentScrollRef,
    currentIndex = 0,
    itemWidth = 0,
  } = props

  // Boolean flag for worklet (refs can't be passed to worklets)
  const hasParentScroll = !!parentScrollRef && itemWidth > 0

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

  // Edge swipe state for Apple Photos-style gallery navigation
  const isAtLeftEdge = useSharedValue(false)
  const isAtRightEdge = useSharedValue(false)
  const panStartX = useSharedValue(0)
  const accumulatedOverflow = useSharedValue(0) // Track overflow for snap decision

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
   * Calculate the maximum translation bounds for a given scale
   * This ensures the content edges don't go past the container edges
   *
   * Apple Photos algorithm:
   * - Content is centered in container
   * - Translation bounds = half of how much scaled content exceeds container
   * - When content fits inside container, bounds = 0 (no panning allowed)
   *
   * IMPORTANT: Use actual contentDimensions from onLayoutContent, not calculated
   * aspect-fit size. Layout system may round dimensions differently than our math.
   */
  const getTranslateBounds = useCallback((currentScale: number): { maxX: number; maxY: number } => {
    'worklet'
    const container = containerDimensions.value
    // Use actual measured content dimensions, not calculated aspect-fit size
    // This ensures bounds match exactly what's rendered on screen
    const content = contentDimensions.value

    // Scaled content dimensions
    const scaledWidth = content.width * currentScale
    const scaledHeight = content.height * currentScale

    // How much the scaled content exceeds the container
    // When scaledSize <= containerSize, excess = 0 (content fits, no panning)
    // When scaledSize > containerSize, excess = scaledSize - containerSize
    const excessWidth = Math.max(0, scaledWidth - container.width)
    const excessHeight = Math.max(0, scaledHeight - container.height)

    // Max translation = half the excess (content can pan from edge to edge)
    // Subtract small padding to ensure content always overlaps edges
    // This prevents subpixel gaps from floating-point rounding
    const safetyPadding = 1
    return {
      maxX: Math.max(0, Math.floor(excessWidth / 2) - safetyPadding),
      maxY: Math.max(0, Math.floor(excessHeight / 2) - safetyPadding),
    }
  }, [containerDimensions, contentDimensions])

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
      // Using gentle spring config to avoid excessive bounce (fix for #51)
      scale.value = withSpring(clampedScale, SPRING_CONFIG)
      translateX.value = withSpring(clampedX, SPRING_CONFIG)
      translateY.value = withSpring(clampedY, SPRING_CONFIG)
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

    // Fire callback if state changed (was not zoomed, now zoomed)
    if (!isZoomedIn.value && onZoomStateChange)
      runOnJS(onZoomStateChange)(true)

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
    onZoomStateChange,
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

    // Fire callback if state changed (was zoomed, now not zoomed)
    if (isZoomedIn.value && onZoomStateChange)
      runOnJS(onZoomStateChange)(false)

    isZoomedIn.value = false
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    isZoomedIn,
    withAnimation,
    minScale,
    onZoomStateChange,
  ])

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

  // Callback for scrolling parent from worklet
  // Compatible with FlatList/ScrollView from react-native, react-native-gesture-handler,
  // and react-native-reanimated (Animated.FlatList/ScrollView)
  const scrollParent = useCallback((offset: number, animated: boolean = false): void => {
    if (!parentScrollRef?.current)
      return

    const ref = parentScrollRef.current

    // Duck-typing to support all FlatList/ScrollView implementations
    if (ref.scrollToOffset)
      ref.scrollToOffset({ offset, animated })
    else if (ref.scrollTo)
      ref.scrollTo({ x: offset, animated })
  }, [parentScrollRef])

  // Delayed zoom reset after snap animation completes
  const resetZoomDelayed = useCallback((delay: number = 300): void => {
    setTimeout(() => {
      scale.value = withSpring(minScale, SPRING_CONFIG)
      translateX.value = withSpring(0, SPRING_CONFIG)
      translateY.value = withSpring(0, SPRING_CONFIG)
      savedScale.value = minScale
      savedTranslateX.value = 0
      savedTranslateY.value = 0
      isZoomedIn.value = false

      if (onZoomStateChange)
        onZoomStateChange(false)
    }, delay)
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    isZoomedIn,
    minScale,
    onZoomStateChange,
  ])

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
    // With enableSwipeToClose + parentScrollRef: seamless edge scrolling
    const panGesture = Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((e: GestureTouchEvent) => {
        'worklet'
        // Store initial touch position and edge state
        if (e.numberOfTouches >= 1) {
          const bounds = getTranslateBounds(scale.value)
          const edgeThreshold = 2

          // Check current edge state
          // At left edge: translateX is at maxX (content shifted right, showing left of image)
          // At right edge: translateX is at -maxX (content shifted left, showing right of image)
          isAtLeftEdge.value = translateX.value >= bounds.maxX - edgeThreshold
          isAtRightEdge.value = translateX.value <= -bounds.maxX + edgeThreshold
          panStartX.value = e.allTouches[0].x
        }
      })
      .onTouchesMove((e: GestureTouchEvent, state: GestureStateManagerType) => {
        'worklet'
        if (e.state === State.ACTIVE)
          return // Already activated

        if (([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state)) {
          const zoomed = scale.value > minScale + 0.01 // Small threshold to avoid float issues

          // 2 finger pan always works (for pinch-pan combo)
          if (e.numberOfTouches === 2) {
            state.activate()
            return
          }

          // Not zoomed - don't activate (let parent handle)
          if (!zoomed) {
            state.fail()
            return
          }

          // Zoomed with 1 finger
          // If we have parentScrollRef - always activate, we'll handle scrolling ourselves
          if (enableSwipeToClose && hasParentScroll) {
            state.activate()
            return
          }

          // Legacy mode: check for edge swipe
          if (enableSwipeToClose && e.numberOfTouches === 1) {
            const touch = e.allTouches[0]
            const deltaX = touch.x - panStartX.value
            const bounds = getTranslateBounds(scale.value)
            const absDeltaX = Math.abs(deltaX)

            // If no horizontal panning is possible, let parent handle
            if (bounds.maxX === 0) {
              state.fail()
              return
            }

            // Wait for sufficient movement before deciding
            const decisionThreshold = 5
            if (absDeltaX < decisionThreshold)
              return // Not enough movement yet, don't decide

            // Check if swiping beyond edge
            // At left edge and swiping right -> let parent handle (go to prev image)
            // At right edge and swiping left -> let parent handle (go to next image)
            if (isAtLeftEdge.value && deltaX > 0) {
              state.fail()
              return
            }
            if (isAtRightEdge.value && deltaX < 0) {
              state.fail()
              return
            }
          }

          // Activate for normal zoomed panning
          state.activate()
        }
      })
      .onStart(() => {
        'worklet'
        updateZoomGestureLastTime()
        isPanning.value = true
        accumulatedOverflow.value = 0 // Reset overflow tracking
        // Save current position
        savedTranslateX.value = translateX.value
        savedTranslateY.value = translateY.value
      })
      .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        'worklet'

        const bounds = getTranslateBounds(scale.value)

        // Calculate new translation
        let newTx = savedTranslateX.value + event.translationX
        const newTy = savedTranslateY.value + event.translationY

        // Apple Photos seamless scrolling with parentScrollRef
        if (enableSwipeToClose && hasParentScroll) {
          // Calculate overflow (how much we're trying to go past the edge)
          let overflow = 0

          if (newTx > bounds.maxX) {
            // Trying to go past left edge (swiping right)
            overflow = newTx - bounds.maxX
            newTx = bounds.maxX
          }
          else if (newTx < -bounds.maxX) {
            // Trying to go past right edge (swiping left)
            overflow = newTx + bounds.maxX // negative value
            newTx = -bounds.maxX
          }

          // If there's overflow, scroll the parent FlatList
          if (overflow !== 0) {
            accumulatedOverflow.value = overflow
            const targetOffset = currentIndex * itemWidth - overflow

            // Scroll parent without animation for smooth tracking
            runOnJS(scrollParent)(targetOffset, false)

            // Lock vertical movement while scrolling parent
            translateX.value = newTx
            return
          }
          else {
            accumulatedOverflow.value = 0
          }
        }
        else {
          // Regular rubber band effect
          const rubber = applyRubberBandTranslation(newTx, newTy, scale.value)
          newTx = rubber.x
        }

        const rubberY = applyRubberBandTranslation(newTx, newTy, scale.value)
        translateX.value = newTx
        translateY.value = rubberY.y
      })
      .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        updateZoomGestureLastTime()
        isPanning.value = false

        const currentScale = scale.value
        const bounds = getTranslateBounds(currentScale)

        // Handle snap for parent scroll (Apple Photos behavior)
        if (enableSwipeToClose && hasParentScroll && accumulatedOverflow.value !== 0) {
          const overflow = accumulatedOverflow.value
          const velocity = event.velocityX
          const snapThreshold = itemWidth * 0.3 // 30% of item width

          // Determine if we should snap to next/prev or back to current
          // Snap to next/prev if: overflow > threshold OR high velocity in same direction
          const shouldSnapToNext = overflow < -snapThreshold || (overflow < 0 && velocity < -500)
          const shouldSnapToPrev = overflow > snapThreshold || (overflow > 0 && velocity > 500)

          if (shouldSnapToNext) {
            // Snap to next image - scroll to next index
            const nextOffset = (currentIndex + 1) * itemWidth
            runOnJS(scrollParent)(nextOffset, true)

            // Reset zoom after snap animation completes
            runOnJS(resetZoomDelayed)(300)
          }
          else if (shouldSnapToPrev) {
            // Snap to previous image - scroll to prev index
            const prevOffset = (currentIndex - 1) * itemWidth
            runOnJS(scrollParent)(prevOffset, true)

            // Reset zoom after snap animation completes
            runOnJS(resetZoomDelayed)(300)
          }
          else {
            // Snap back to current image
            const currentOffset = currentIndex * itemWidth
            runOnJS(scrollParent)(currentOffset, true)
          }

          accumulatedOverflow.value = 0
          return
        }

        // Check if we're outside bounds
        const currentTx = translateX.value
        const currentTy = translateY.value
        const isOutOfBoundsX = currentTx < -bounds.maxX || currentTx > bounds.maxX
        const isOutOfBoundsY = currentTy < -bounds.maxY || currentTy > bounds.maxY

        if (isOutOfBoundsX || isOutOfBoundsY) {
          // Spring back to bounds with gentle animation (fix for #51)
          translateX.value = withSpring(
            clamp(currentTx, -bounds.maxX, bounds.maxX),
            SPRING_CONFIG
          )
          translateY.value = withSpring(
            clamp(currentTy, -bounds.maxY, bounds.maxY),
            SPRING_CONFIG
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
      .onTouchesCancelled(() => {
        'worklet'
        isPanning.value = false
      })
      .minDistance(0)
      .minPointers(1)
      .maxPointers(2)

    // ========== PINCH GESTURE ==========
    // Apple Photos: dynamic focal point tracking during pinch
    const pinchGesture = Gesture.Pinch()
      .onTouchesDown((e: GestureTouchEvent, state: GestureStateManagerType) => {
        'worklet'
        // Immediately activate pinch when 2 fingers touch
        // This prevents horizontal FlatList from stealing the gesture on Android
        if (e.numberOfTouches === 2)
          state.activate()
      })
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

        // Check previous zoom state before applying constraints
        const wasZoomed = isZoomedIn.value

        // Apply boundary constraints with spring animation
        applyBoundaryConstraints(scale.value, true)

        // Fire callback if zoom state changed
        const finalScale = clamp(scale.value, minScale, maxScale)
        const isNowZoomed = finalScale > minScale
        if (wasZoomed !== isNowZoomed && onZoomStateChange)
          runOnJS(onZoomStateChange)(isNowZoomed)
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
    onZoomStateChange,
    isZoomedIn,
    enableSwipeToClose,
    isAtLeftEdge,
    isAtRightEdge,
    panStartX,
    hasParentScroll,
    currentIndex,
    itemWidth,
    scrollParent,
    accumulatedOverflow,
    resetZoomDelayed,
  ])

  // ============== ANIMATED STYLE ==============
  // Transform order: translate first, then scale
  // This means scale happens around the center of the View
  //
  // Apple Photos rendering approach:
  // - Use exact floating-point values for smooth animations
  // - The content View should have explicit dimensions matching aspect ratio
  // - overflow: hidden on container clips any subpixel overflow
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
  /**
   * Callback fired when zoom state changes (zoomed in or out).
   * Called with true when zoomed in, false when zoomed out to initial scale.
   */
  onZoomStateChange?: (isZoomed: boolean) => void
  /**
   * Enable horizontal swipe to pass through to parent (e.g., FlatList) when at edge.
   * Apple Photos behavior: when zoomed and panning hits horizontal boundary,
   * continued swipe in same direction allows parent scroll to take over.
   * Default is false.
   */
  enableSwipeToClose?: boolean
  /**
   * Reference to parent FlatList/ScrollView for seamless edge scrolling.
   * When provided, enables Apple Photos-style continuous swipe:
   * zoomed image pans to edge, then seamlessly scrolls parent list.
   */
  parentScrollRef?: RefObject<ScrollableRef | null>
  /**
   * Current index in the parent list (for calculating scroll offset).
   * Required when using parentScrollRef.
   */
  currentIndex?: number
  /**
   * Width of each item in the parent list (for calculating scroll offset).
   * Required when using parentScrollRef. Usually equals device width.
   */
  itemWidth?: number

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
