import React, { type PropsWithChildren } from 'react'
import { View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import { resolveGestureApiVersion } from './gestureApi'
import { useZoomGestureV2 } from './useZoomGestureV2'
import { useZoomGestureV3 } from './useZoomGestureV3'
import styles from './styles'
import type {
  UseZoomGestureProps,
  UseZoomGestureReturnBase,
  ZoomGestureV2,
  ZoomGestureV3,
  ZoomProps,
} from './types'

/**
 * Props consumed by the rendering part of `Zoom`, i.e. everything that is not forwarded
 * to the gesture hook.
 */
interface ZoomViewProps extends PropsWithChildren {
  style?: ZoomProps['style']
  contentContainerStyle?: ZoomProps['contentContainerStyle']
  onZoomChange?: ZoomProps['onZoomChange']
  onZoomStateChange?: ZoomProps['onZoomStateChange']
  zoom: UseZoomGestureReturnBase<ZoomGestureV2 | ZoomGestureV3>
}

/**
 * Shared rendering + JS callback bridging for both gesture-handler API variants.
 */
function ZoomView({
  style,
  contentContainerStyle,
  children,
  onZoomChange,
  onZoomStateChange,
  zoom,
}: ZoomViewProps): React.JSX.Element {
  const {
    zoomGesture,
    onLayout,
    onLayoutContent,
    contentContainerAnimatedStyle,
    scale,
    isZoomedIn,
  } = zoom

  // Bridge scale changes to JS callback if provided
  useAnimatedReaction(
    () => scale.value,
    (currentScale, previousScale) => {
      if (onZoomChange && currentScale !== previousScale)
        runOnJS(onZoomChange)(currentScale)
    },
    [onZoomChange]
  )

  // Bridge zoom state changes to JS callback if provided
  useAnimatedReaction(
    () => isZoomedIn.value,
    (currentIsZoomed, previousIsZoomed) => {
      if (onZoomStateChange && currentIsZoomed !== previousIsZoomed)
        runOnJS(onZoomStateChange)(currentIsZoomed)
    },
    [onZoomStateChange]
  )

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      {/*
        GestureDetector accepts gestures from both gesture-handler API versions at runtime
        (on 3.x it is the v3 detector, which also handles v2 gesture objects), but its props
        are a union that TypeScript cannot narrow from our union, so we pin one member here.
      */}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion */}
      <GestureDetector gesture={zoomGesture as ZoomGestureV2}>
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

interface ZoomVariantProps extends Omit<ZoomViewProps, 'zoom'> {
  gestureProps: UseZoomGestureProps
}

function ZoomWithGestureApiV2({ gestureProps, ...viewProps }: ZoomVariantProps): React.JSX.Element {
  const zoom = useZoomGestureV2(gestureProps)

  return <ZoomView {...viewProps} zoom={zoom} />
}

function ZoomWithGestureApiV3({ gestureProps, ...viewProps }: ZoomVariantProps): React.JSX.Element {
  const zoom = useZoomGestureV3(gestureProps)

  return <ZoomView {...viewProps} zoom={zoom} />
}

/**
 * Zoom component that provides pinch, pan, and double-tap gestures for zooming content
 * Implements Apple Photos-style zoom behavior
 *
 * The gesture is built with whichever react-native-gesture-handler gestures API the installed
 * version provides: the v3 hooks API on 3.x, the v2 builder API on 2.x. Pass `gestureApi="v2"`
 * or `"v3"` (or call `setGestureApiVersion` once at startup) to pin it.
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
  const {
    gestureApi,
    style,
    contentContainerStyle,
    children,
    onZoomChange,
    onZoomStateChange,
    ...gestureProps
  } = props

  const viewProps = {
    style,
    contentContainerStyle,
    children,
    onZoomChange,
    onZoomStateChange,
  }

  // Rendering a different component type per API version keeps the hook order stable even
  // when the choice changes: React remounts instead of reordering hooks.
  if (resolveGestureApiVersion(gestureApi) === 'v3')
    return <ZoomWithGestureApiV3 {...viewProps} gestureProps={gestureProps} />

  return <ZoomWithGestureApiV2 {...viewProps} gestureProps={gestureProps} />
}
