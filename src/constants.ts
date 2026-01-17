/**
 * Default zoom scale constraints
 */
export const MIN_SCALE = 1.4
export const MAX_SCALE = 4

/**
 * Animation configuration constants
 */
export const ANIMATION_DURATION = 350

/**
 * Gesture detection thresholds
 */
export const TAP_MAX_DELTA = 25
export const PAN_DEBOUNCE_MS = 10

/**
 * Minimum number of pointers for pan gesture
 */
export const MIN_PAN_POINTERS = 2
export const MAX_PAN_POINTERS = 2

/**
 * Grouped zoom configuration
 */
export const ZOOM_CONFIG = {
  MIN_SCALE,
  MAX_SCALE,
  ANIMATION_DURATION,
  TAP_MAX_DELTA,
  PAN_DEBOUNCE_MS,
  MIN_PAN_POINTERS,
  MAX_PAN_POINTERS,
} as const
