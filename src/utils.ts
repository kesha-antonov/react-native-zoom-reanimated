/**
 * Clamps a value between a minimum and maximum
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  'worklet'
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculates appropriate zoom scale based on content dimensions
 * Returns a moderate zoom level (2x) as the default for double-tap
 * The scale is consistent regardless of aspect ratio for predictable UX
 * @returns Suggested zoom scale (default 2x)
 */
export const getScaleFromDimensions = (): number => {
  // Return a consistent 2x zoom for double-tap
  // This provides a predictable, non-aggressive zoom experience
  // Users can always pinch to zoom further if needed
  return 2
}

/**
 * Dimensions interface for consistent type usage
 */
export interface Dimensions {
  width: number
  height: number
}

/**
 * Offset interface for x/y coordinates
 */
export interface Offset {
  x: number
  y: number
}

/**
 * Calculates maximum allowed offset for panning to keep content within bounds
 * @param contentSize - Size of the content being zoomed
 * @param containerSize - Size of the container
 * @param scale - Current zoom scale
 * @returns Maximum offset in x and y directions
 */
export const calculateMaxOffset = (
  contentSize: Dimensions,
  containerSize: Dimensions,
  scale: number
): Offset => {
  'worklet'
  const scaledContentWidth = contentSize.width * scale
  const scaledContentHeight = contentSize.height * scale

  return {
    x: scaledContentWidth < containerSize.width
      ? 0
      : (scaledContentWidth - containerSize.width) / 2 / scale,
    y: scaledContentHeight < containerSize.height
      ? 0
      : (scaledContentHeight - containerSize.height) / 2 / scale,
  }
}

/**
 * Resets offset values to zero with optional animation
 * @param offsetX - Shared value for X offset
 * @param offsetY - Shared value for Y offset
 * @param translateX - Shared value for X translation
 * @param translateY - Shared value for Y translation
 * @param withAnimation - Optional animation function
 */
export const resetOffsets = (
  offsetX: { value: number },
  offsetY: { value: number },
  translateX: { value: number },
  translateY: { value: number },
  withAnimation?: (value: number) => number
): void => {
  'worklet'
  const newOffset = 0
  offsetX.value = newOffset
  offsetY.value = newOffset

  if (withAnimation) {
    translateX.value = withAnimation(newOffset)
    translateY.value = withAnimation(newOffset)
  }
  else {
    translateX.value = newOffset
    translateY.value = newOffset
  }
}
