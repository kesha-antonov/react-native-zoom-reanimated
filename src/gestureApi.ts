import * as GestureHandler from 'react-native-gesture-handler'
import type { GestureTouchEvent } from 'react-native-gesture-handler'
import type {
  GestureApiVersion,
  GestureApiVersionSetting,
  ZoomGestureV3,
} from './types'

/**
 * Minimal structural typings for the react-native-gesture-handler v3 hooks API.
 *
 * They are declared locally instead of imported from react-native-gesture-handler so that
 * this package keeps type-checking against react-native-gesture-handler 2.x, where the v3
 * entry points do not exist.
 */

export interface V3TapEvent {
  x: number
  y: number
}

export interface V3PanEvent {
  translationX: number
  translationY: number
  velocityX: number
  velocityY: number
}

export interface V3PinchEvent {
  scale: number
  focalX: number
  focalY: number
}

type V3TouchCallback = (event: GestureTouchEvent) => void

interface V3CommonConfig {
  manualActivation?: boolean
  onTouchesDown?: V3TouchCallback
  onTouchesMove?: V3TouchCallback
  onTouchesCancel?: V3TouchCallback
}

export interface V3TapConfig extends V3CommonConfig {
  numberOfTaps?: number
  maxDeltaX?: number
  maxDeltaY?: number
  onDeactivate?: (event: V3TapEvent) => void
}

export interface V3PanConfig extends V3CommonConfig {
  minDistance?: number
  minPointers?: number
  maxPointers?: number
  onActivate?: () => void
  onUpdate?: (event: V3PanEvent) => void
  onDeactivate?: (event: V3PanEvent) => void
}

export interface V3PinchConfig extends V3CommonConfig {
  onActivate?: (event: V3PinchEvent) => void
  onUpdate?: (event: V3PinchEvent) => void
  onDeactivate?: () => void
}

/** Opaque handle to a gesture created by the v3 hooks API. */
export type V3Gesture = object

export interface V3GestureStateManager {
  activate: (handlerTag: number) => void
  fail: (handlerTag: number) => void
  deactivate: (handlerTag: number) => void
}

export interface GestureApiV3 {
  useTapGesture: (config: V3TapConfig) => V3Gesture
  usePanGesture: (config: V3PanConfig) => V3Gesture
  usePinchGesture: (config: V3PinchConfig) => V3Gesture
  useSimultaneousGestures: (...gestures: V3Gesture[]) => ZoomGestureV3
  GestureStateManager: V3GestureStateManager
}

// react-native-gesture-handler 3.x re-exports the v3 hooks API from the package root.
// On 2.x these are simply missing, which is what the detection below relies on.
const maybeV3 = GestureHandler as unknown as Partial<GestureApiV3>

/**
 * Whether the installed react-native-gesture-handler exposes the v3 hooks API.
 * True for react-native-gesture-handler >= 3, false for 2.x.
 */
export function isGestureApiV3Supported(): boolean {
  return (
    typeof maybeV3.useTapGesture === 'function'
    && typeof maybeV3.usePanGesture === 'function'
    && typeof maybeV3.usePinchGesture === 'function'
    && typeof maybeV3.useSimultaneousGestures === 'function'
    && typeof maybeV3.GestureStateManager === 'object'
  )
}

/**
 * Returns the v3 hooks API, throwing a descriptive error when it is unavailable.
 */
export function requireGestureApiV3(): GestureApiV3 {
  if (!isGestureApiV3Supported())
    throw new Error(
      '[react-native-zoom-reanimated] The react-native-gesture-handler v3 gestures API is not '
      + 'available. Upgrade to react-native-gesture-handler >= 3, or use the v2 API '
      + '(useZoomGesture / <Zoom gestureApi="v2" />).'
    )

  return maybeV3 as GestureApiV3
}

let configuredVersion: GestureApiVersionSetting = 'auto'

/**
 * Sets the react-native-gesture-handler API version used by `useZoomGesture` and by `<Zoom />`
 * when it is rendered without an explicit `gestureApi` prop.
 *
 * Defaults to `'auto'`: the v3 hooks API when the installed react-native-gesture-handler
 * provides it, the v2 builder API otherwise. Pass `'v2'` to always use the builder API, which
 * works on both react-native-gesture-handler 2.x and 3.x.
 *
 * Call this once during app startup, before rendering any `<Zoom />`. A component keeps the
 * version it resolved on its first render, so changing this later only affects new mounts.
 */
export function setGestureApiVersion(version: GestureApiVersionSetting): void {
  configuredVersion = version
}

/**
 * Resolves a `GestureApiVersionSetting` to a concrete version.
 * `'auto'` becomes `'v3'` when the v3 hooks API is available, `'v2'` otherwise.
 */
export function resolveGestureApiVersion(
  version: GestureApiVersionSetting = configuredVersion
): GestureApiVersion {
  if (version === 'auto')
    return isGestureApiV3Supported() ? 'v3' : 'v2'

  return version
}

/**
 * The currently configured default, resolved to a concrete version.
 */
export function getGestureApiVersion(): GestureApiVersion {
  return resolveGestureApiVersion()
}
