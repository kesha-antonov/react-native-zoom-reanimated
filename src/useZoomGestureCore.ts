import { useCallback, useMemo } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { State, type GestureTouchEvent } from 'react-native-gesture-handler'
import {
  Easing,
  runOnJS,
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
} from './constants'
import { clamp, type Dimensions } from './utils'
import type {
  AnimationConfigProps,
  UseZoomGestureProps,
  UseZoomGestureReturnBase,
} from './types'

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
 * Gesture payloads, described structurally so the same worklets can be fed by both the
 * react-native-gesture-handler v2 and v3 event shapes.
 */
export interface ZoomTapEvent {
  x: number
  y: number
}

export interface ZoomPanEvent {
  translationX: number
  translationY: number
  velocityX: number
  velocityY: number
}

export interface ZoomPinchEvent {
  scale: number
  focalX: number
  focalY: number
}

/**
 * What the pan gesture should do with a manual-activation touch move.
 * The caller applies it through the state manager of its own gesture-handler API version.
 */
export type PanActivationDecision = 'none' | 'activate' | 'fail'

export interface ZoomTapGestureConfig {
  numberOfTaps: number
  maxDeltaX: number
  maxDeltaY: number
}

export interface ZoomPanGestureConfig {
  minDistance: number
  minPointers: number
  maxPointers: number
}

/**
 * Everything a gesture-handler adapter needs to build the zoom gesture, plus the parts of
 * the public hook result that do not depend on the gesture-handler API version.
 */
export interface ZoomGestureCore extends Omit<UseZoomGestureReturnBase<never>, 'zoomGesture'> {
  tapConfig: ZoomTapGestureConfig
  panConfig: ZoomPanGestureConfig
  handleTapEnd: (event: ZoomTapEvent) => void
  handlePanTouchesDown: (event: GestureTouchEvent) => void
  decidePanActivation: (event: GestureTouchEvent) => PanActivationDecision
  handlePanStart: () => void
  handlePanUpdate: (event: ZoomPanEvent) => void
  handlePanEnd: (event: ZoomPanEvent) => void
  handlePanTouchesCancelled: () => void
  shouldActivatePinch: (event: GestureTouchEvent) => boolean
  handlePinchStart: (event: ZoomPinchEvent) => void
  handlePinchUpdate: (event: ZoomPinchEvent) => void
  handlePinchEnd: () => void
}

/**
 * Apple Photos-style zoom logic, shared by every gesture-handler API adapter.
 *
 * Key principles from Apple Photos:
 * 1. Transform order: translate first, then scale (scale around center)
 * 2. Focal point stays under finger during pinch
 * 3. Rubber band effect when over-zooming or at boundaries
 * 4. Smooth spring animations for snap-back
 * 5. Momentum-based panning with boundary bounce
 */
export function useZoomGestureCore(props: UseZoomGestureProps = {}): ZoomGestureCore {
  const {
    animationFunction = withTiming,
    animationConfig,
    doubleTapConfig,
    minScale = 1,
    maxScale = MAX_SCALE,
    enableGallerySwipe = false,
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
  ])

  // ============== GESTURE LOGIC (API-AGNOSTIC) ==============

  // ========== DOUBLE TAP ==========
  const handleTapEnd = useCallback((event: ZoomTapEvent): void => {
    'worklet'
    updateZoomGestureLastTime()
    onDoubleTap(event.x, event.y)
  }, [updateZoomGestureLastTime, onDoubleTap])

  // ========== PAN GESTURE ==========
  // Apple Photos: 1 finger when zoomed in, 2 fingers when at 1x
  // With enableGallerySwipe + parentScrollRef: seamless edge scrolling
  const handlePanTouchesDown = useCallback((e: GestureTouchEvent): void => {
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
  }, [getTranslateBounds, scale, translateX, isAtLeftEdge, isAtRightEdge, panStartX])

  const decidePanActivation = useCallback((e: GestureTouchEvent): PanActivationDecision => {
    'worklet'
    if (e.state === State.ACTIVE)
      return 'none' // Already activated

    if (!([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state))
      return 'none'

    const zoomed = scale.value > minScale + 0.01 // Small threshold to avoid float issues

    // 2 finger pan always works (for pinch-pan combo)
    if (e.numberOfTouches === 2)
      return 'activate'

    // Not zoomed - don't activate (let parent handle)
    if (!zoomed)
      return 'fail'

    // Zoomed with 1 finger
    // If we have parentScrollRef - always activate, we'll handle scrolling ourselves
    if (enableGallerySwipe && hasParentScroll)
      return 'activate'

    // Legacy mode: check for edge swipe
    if (enableGallerySwipe && e.numberOfTouches === 1) {
      const touch = e.allTouches[0]
      const deltaX = touch.x - panStartX.value
      const bounds = getTranslateBounds(scale.value)
      const absDeltaX = Math.abs(deltaX)

      // If no horizontal panning is possible, let parent handle
      if (bounds.maxX === 0)
        return 'fail'

      // Wait for sufficient movement before deciding
      const decisionThreshold = 5
      if (absDeltaX < decisionThreshold)
        return 'none' // Not enough movement yet, don't decide

      // Check if swiping beyond edge
      // At left edge and swiping right -> let parent handle (go to prev image)
      // At right edge and swiping left -> let parent handle (go to next image)
      if (isAtLeftEdge.value && deltaX > 0)
        return 'fail'

      if (isAtRightEdge.value && deltaX < 0)
        return 'fail'
    }

    // Activate for normal zoomed panning
    return 'activate'
  }, [
    scale,
    minScale,
    enableGallerySwipe,
    hasParentScroll,
    panStartX,
    getTranslateBounds,
    isAtLeftEdge,
    isAtRightEdge,
  ])

  const handlePanStart = useCallback((): void => {
    'worklet'
    updateZoomGestureLastTime()
    isPanning.value = true
    accumulatedOverflow.value = 0 // Reset overflow tracking
    // Save current position
    savedTranslateX.value = translateX.value
    savedTranslateY.value = translateY.value
  }, [
    updateZoomGestureLastTime,
    isPanning,
    accumulatedOverflow,
    savedTranslateX,
    savedTranslateY,
    translateX,
    translateY,
  ])

  const handlePanUpdate = useCallback((event: ZoomPanEvent): void => {
    'worklet'

    const bounds = getTranslateBounds(scale.value)

    // Calculate new translation
    let newTx = savedTranslateX.value + event.translationX
    const newTy = savedTranslateY.value + event.translationY

    // Apple Photos seamless scrolling with parentScrollRef
    if (enableGallerySwipe && hasParentScroll) {
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
  }, [
    getTranslateBounds,
    scale,
    savedTranslateX,
    savedTranslateY,
    enableGallerySwipe,
    hasParentScroll,
    accumulatedOverflow,
    currentIndex,
    itemWidth,
    scrollParent,
    translateX,
    translateY,
    applyRubberBandTranslation,
  ])

  const handlePanEnd = useCallback((event: ZoomPanEvent): void => {
    'worklet'
    updateZoomGestureLastTime()
    isPanning.value = false

    const currentScale = scale.value
    const bounds = getTranslateBounds(currentScale)

    // Handle snap for parent scroll (Apple Photos behavior)
    if (enableGallerySwipe && hasParentScroll && accumulatedOverflow.value !== 0) {
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
  }, [
    updateZoomGestureLastTime,
    isPanning,
    scale,
    getTranslateBounds,
    enableGallerySwipe,
    hasParentScroll,
    accumulatedOverflow,
    itemWidth,
    currentIndex,
    scrollParent,
    resetZoomDelayed,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ])

  const handlePanTouchesCancelled = useCallback((): void => {
    'worklet'
    isPanning.value = false
  }, [isPanning])

  // ========== PINCH GESTURE ==========
  // Apple Photos: dynamic focal point tracking during pinch
  const shouldActivatePinch = useCallback((e: GestureTouchEvent): boolean => {
    'worklet'
    // Immediately activate pinch when 2 fingers touch
    // This prevents horizontal FlatList from stealing the gesture on Android
    return e.numberOfTouches === 2
  }, [])

  const handlePinchStart = useCallback((event: ZoomPinchEvent): void => {
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
  }, [
    updateZoomGestureLastTime,
    isPinching,
    savedScale,
    scale,
    savedTranslateX,
    savedTranslateY,
    translateX,
    translateY,
    pinchFocalX,
    pinchFocalY,
  ])

  const handlePinchUpdate = useCallback((event: ZoomPinchEvent): void => {
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
  }, [
    containerDimensions,
    savedScale,
    minScale,
    maxScale,
    pinchFocalX,
    pinchFocalY,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
  ])

  const handlePinchEnd = useCallback((): void => {
    'worklet'
    updateZoomGestureLastTime()
    isPinching.value = false

    // Check previous zoom state before applying constraints
    const wasZoomed = isZoomedIn.value

    // Apply boundary constraints with spring animation
    applyBoundaryConstraints(scale.value, true)

    // Update isZoomedIn state
    const finalScale = clamp(scale.value, minScale, maxScale)
    const isNowZoomed = finalScale > minScale
    if (wasZoomed !== isNowZoomed)
      isZoomedIn.value = isNowZoomed
  }, [
    updateZoomGestureLastTime,
    isPinching,
    isZoomedIn,
    applyBoundaryConstraints,
    scale,
    minScale,
    maxScale,
  ])

  // ============== GESTURE CONFIG ==============

  const tapConfig = useMemo<ZoomTapGestureConfig>(() => ({
    numberOfTaps: 2,
    maxDeltaX: TAP_MAX_DELTA,
    maxDeltaY: TAP_MAX_DELTA,
  }), [])

  const panConfig = useMemo<ZoomPanGestureConfig>(() => ({
    minDistance: 0,
    minPointers: 1,
    maxPointers: 2,
  }), [])

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

  const zoomOutPublic = useCallback((): void => {
    'worklet'
    zoomOut()
  }, [zoomOut])

  return useMemo(() => ({
    tapConfig,
    panConfig,
    handleTapEnd,
    handlePanTouchesDown,
    decidePanActivation,
    handlePanStart,
    handlePanUpdate,
    handlePanEnd,
    handlePanTouchesCancelled,
    shouldActivatePinch,
    handlePinchStart,
    handlePinchUpdate,
    handlePinchEnd,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut: zoomOutPublic,
    isZoomedIn,
    zoomGestureLastTime,
    scale,
  }), [
    tapConfig,
    panConfig,
    handleTapEnd,
    handlePanTouchesDown,
    decidePanActivation,
    handlePanStart,
    handlePanUpdate,
    handlePanEnd,
    handlePanTouchesCancelled,
    shouldActivatePinch,
    handlePinchStart,
    handlePinchUpdate,
    handlePinchEnd,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOutPublic,
    isZoomedIn,
    zoomGestureLastTime,
    scale,
  ])
}
