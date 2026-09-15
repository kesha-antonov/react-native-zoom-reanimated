import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import type { RefObject } from 'react'
import type * as GestureHandler from 'react-native-gesture-handler'
import type {
  AnimatableValue,
  AnimationCallback,
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'

/**
 * Which react-native-gesture-handler API the zoom gesture is built with.
 *
 * - `v2` - the `Gesture.Pan()` / `Gesture.Pinch()` builder API. Available in
 *   react-native-gesture-handler 2.x and still shipped by 3.x, so it works everywhere.
 * - `v3` - the hooks API (`usePanGesture`, `usePinchGesture`, ...) introduced in
 *   react-native-gesture-handler 3.x. Required if you want to compose the zoom gesture
 *   with your own v3 gestures.
 */
export type GestureApiVersion = 'v2' | 'v3'

/**
 * Same as {@link GestureApiVersion}, plus `auto` which resolves to `v3` when the
 * installed react-native-gesture-handler exposes the v3 hooks API, and to `v2` otherwise.
 */
export type GestureApiVersionSetting = GestureApiVersion | 'auto'

/**
 * Gesture object produced when building with the react-native-gesture-handler v2 API.
 */
export type ZoomGestureV2 = ReturnType<typeof GestureHandler.Gesture.Simultaneous>

/**
 * Gesture object produced when building with the react-native-gesture-handler v3 hooks API.
 *
 * Note: on react-native-gesture-handler 2.x this type resolves to the v2 composed gesture,
 * because the v3 API does not exist there. Using the v3 code path on 2.x throws at runtime.
 */
export type ZoomGestureV3 = GestureHandler.ComposedGesture

/**
 * Whether the installed react-native-gesture-handler exposes the v3 hooks gestures API.
 * Resolved at compile time against the consumer's own installed version, mirroring what
 * `isGestureApiV3Supported()` reports at runtime.
 */
export type IsGestureApiV3Supported
  = 'useSimultaneousGestures' extends keyof typeof GestureHandler ? true : false

/**
 * The gesture object produced by the auto-selected gesture-handler API: the v3 one when the
 * installed react-native-gesture-handler provides it, the v2 one otherwise.
 */
export type ZoomGestureAuto = IsGestureApiV3Supported extends true ? ZoomGestureV3 : ZoomGestureV2

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
   * Enable seamless gallery swipe navigation to parent (e.g., FlatList) when at edge.
   * Apple Photos behavior: when zoomed and panning hits horizontal boundary,
   * continued swipe in same direction allows parent scroll to take over.
   * Default is false.
   */
  enableGallerySwipe?: boolean
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
 * Return type for the useZoomGesture family of hooks, parameterized by the
 * react-native-gesture-handler API used to build the gesture.
 */
export interface UseZoomGestureReturnBase<TGesture> {
  zoomGesture: TGesture
  contentContainerAnimatedStyle: ReturnType<typeof useAnimatedStyle>
  onLayout: (event: LayoutChangeEvent) => void
  onLayoutContent: (event: LayoutChangeEvent) => void
  zoomOut: () => void
  isZoomedIn: SharedValue<boolean>
  zoomGestureLastTime: SharedValue<number>
  /**
   * Current zoom scale as SharedValue.
   * Use with useAnimatedReaction or useDerivedValue for efficient worklet-based tracking.
   * Updated in real-time during pinch gestures without JS bridge overhead.
   */
  scale: SharedValue<number>
}

/**
 * Return type of `useZoomGesture`, which follows the installed gesture-handler version.
 */
export type UseZoomGestureReturn = UseZoomGestureReturnBase<ZoomGestureAuto>

/**
 * Return type of `useZoomGestureV2`.
 */
export type UseZoomGestureReturnV2 = UseZoomGestureReturnBase<ZoomGestureV2>

/**
 * Return type of `useZoomGestureV3`.
 */
export type UseZoomGestureReturnV3 = UseZoomGestureReturnBase<ZoomGestureV3>

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
   * Callback fired during zoom gesture with current scale value.
   * Called continuously while pinching, useful for UI updates (e.g., showing zoom percentage).
   * Note: For performance-critical use cases, use useZoomGesture hook with scale SharedValue instead.
   */
  onZoomChange?: (scale: number) => void
  /**
   * Enable seamless gallery swipe navigation to parent (e.g., FlatList) when at edge.
   * Apple Photos behavior: when zoomed and panning hits horizontal boundary,
   * continued swipe in same direction allows parent scroll to take over.
   * Default is false.
   */
  enableGallerySwipe?: boolean
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
  /**
   * Which react-native-gesture-handler API to build the gesture with.
   * Defaults to the value set by `setGestureApiVersion` (`'auto'` unless changed), which picks
   * the v3 hooks API when the installed react-native-gesture-handler provides it.
   *
   * Changing this prop on a mounted Zoom remounts its gesture tree.
   */
  gestureApi?: GestureApiVersionSetting

  animationFunction?: <T extends AnimatableValue>(
    toValue: T,
    userConfig?: AnimationConfigProps,
    callback?: AnimationCallback
  ) => T
}
