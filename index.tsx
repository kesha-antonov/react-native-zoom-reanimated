/* eslint-disable react/display-name */
/* eslint-disable quotes */
/* eslint-disable max-len */
import React, {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react"
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  Platform,
} from "react-native"
import Animated, {
  AnimatableValue,
  AnimationCallback,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler"
import { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager"

export interface ZoomRef {
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
}

export default forwardRef<ZoomRef, PropsWithChildren<ZoomProps>>(
  (props, ref) => {
    const {
      style,
      contentContainerStyle,
      children,
      animationFunction = withTiming,
      animationConfig,
      panThreshold = 0,
	  onZoomStateChange,
    } = props

    const baseScale = useSharedValue(0.75)
    const pinchScale = useSharedValue(1)
    const lastScale = useSharedValue(1)
    const isZoomedIn = useSharedValue(false)

    useAnimatedReaction(
      () => isZoomedIn.value,
      (current, prev) => {
        if (current !== prev && onZoomStateChange)
          runOnJS(onZoomStateChange)(current)
      }
    )

    const containerDimensions = useSharedValue({ width: 0, height: 0 })
    const contentDimensions = useSharedValue({ width: 1, height: 1 })

    const translateX = useSharedValue(0)
    const translateY = useSharedValue(0)
    const lastOffsetX = useSharedValue(0)
    const lastOffsetY = useSharedValue(0)
    const panStartOffsetX = useSharedValue(0)
    const panStartOffsetY = useSharedValue(0)
    const startX = useSharedValue(0) // Store initial X position
    const startY = useSharedValue(0) // Store initial Y position

    const handlePanOutsideTimeoutId: React.MutableRefObject<
			number | undefined
		> = useRef()

    const containerRef = useRef<View>(null)
    const scrollWheelSubscriptionRef = useRef<number | null>(null)

    const withAnimation = useCallback(
      (toValue: number, config?: object) => {
        "worklet"

        return animationFunction(toValue, {
          duration: 350,
          ...config,
          ...animationConfig,
        })
      },
      [animationFunction, animationConfig]
    )

    const onWheelScroll = useCallback(
      (event: WheelEvent) => {
        const scaleFactor = event.deltaY * -0.01
        const newScale = lastScale.value + scaleFactor
        const newSafeScale = Math.max(0.75, Math.min(newScale, 4))
        lastScale.value = newSafeScale
        baseScale.value = withAnimation(newSafeScale)
      },
      [baseScale, lastScale, withAnimation]
    )

    const getContentContainerSize = useCallback(() => {
      return {
        width: containerDimensions.value.width,
        height:
					(contentDimensions.value.height *
						containerDimensions.value.width) /
					contentDimensions.value.width,
      }
    }, [containerDimensions.value.width, contentDimensions.value.height, contentDimensions.value.width])

    const zoomIn = useCallback((): void => {
      let newScale = baseScale.value * 1.25
      if (newScale > 4) newScale = 4

      lastScale.value = newScale

      baseScale.value = withAnimation(newScale)
      pinchScale.value = withAnimation(1)

      const newOffsetX = 0
      lastOffsetX.value = newOffsetX

      const newOffsetY = 0
      lastOffsetY.value = newOffsetY

      translateX.value = newOffsetX
      translateY.value = newOffsetY

      isZoomedIn.value = true
    }, [baseScale, pinchScale, lastOffsetX, lastOffsetY, translateX, translateY, isZoomedIn, lastScale, withAnimation])

    const zoomOut = useCallback((): void => {
      let newScale = baseScale.value * 0.75
	  if (newScale < 0.75) newScale = 0.75
      lastScale.value = newScale

      baseScale.value = withAnimation(newScale)
      pinchScale.value = withAnimation(1)

      const newOffsetX = 0
      lastOffsetX.value = newOffsetX

      const newOffsetY = 0
      lastOffsetY.value = newOffsetY

      translateX.value = withAnimation(newOffsetX)
      translateY.value = withAnimation(newOffsetY)

	  if (newScale === 0.75)
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

    const resetZoom = useCallback((): void => {
      lastScale.value = 1
      baseScale.value = withAnimation(0.75)
      pinchScale.value = withAnimation(1)
      lastOffsetX.value = 0
      lastOffsetY.value = 0
      translateX.value = withAnimation(0)
      translateY.value = withAnimation(0)
      isZoomedIn.value = false

    }, [baseScale, isZoomedIn, lastOffsetX, lastOffsetY, lastScale, pinchScale, translateX, translateY, withAnimation])

    const handlePanOutside = useCallback((): void => {
      if (handlePanOutsideTimeoutId.current !== undefined)
        clearTimeout(handlePanOutsideTimeoutId.current)

      handlePanOutsideTimeoutId.current = setTimeout((): void => {
        const { width, height } = getContentContainerSize()
        const maxOffset = {
          x: width * lastScale.value < containerDimensions.value.width ? 0 : (width * lastScale.value - containerDimensions.value.width) / 2 / lastScale.value,
          y: height * lastScale.value < containerDimensions.value.height ? 0 : (height * lastScale.value - containerDimensions.value.height) / 2 / lastScale.value,
        }

        const isPanedXOutside =
					lastOffsetX.value > maxOffset.x ||
					lastOffsetX.value < -maxOffset.x
        if (isPanedXOutside) {
          const newOffsetX =
						lastOffsetX.value >= 0 ? maxOffset.x : -maxOffset.x
          lastOffsetX.value = newOffsetX

          translateX.value = withAnimation(newOffsetX)
        } else {
          translateX.value = lastOffsetX.value
        }

        const isPanedYOutside =
					lastOffsetY.value > maxOffset.y ||
					lastOffsetY.value < -maxOffset.y
        if (isPanedYOutside) {
          const newOffsetY =
						lastOffsetY.value >= 0 ? maxOffset.y : -maxOffset.y
          lastOffsetY.value = newOffsetY

          translateY.value = withAnimation(newOffsetY)
        } else {
          translateY.value = lastOffsetY.value
        }
      }, 10)
    }, [
      lastOffsetX,
      lastOffsetY,
      lastScale,
      translateX,
      translateY,
      containerDimensions,
      getContentContainerSize,
      withAnimation,
    ])

    const onDoubleTap = useCallback((): void => {
      if (isZoomedIn.value) zoomOut()
      else zoomIn()
    }, [zoomIn, zoomOut, isZoomedIn])

    const onLayout = useCallback(
      ({
        nativeEvent: {
          layout: { width, height },
        },
      }: LayoutChangeEvent): void => {
        if (
          Platform.OS !== "ios" &&
					Platform.OS !== "android" &&
					containerRef.current &&
					!scrollWheelSubscriptionRef.current
        )
          scrollWheelSubscriptionRef.current =
						// @ts-expect-error - web only
						containerRef.current.addEventListener("wheel", onWheelScroll)

        containerDimensions.value = {
          width,
          height,
        }
      },
      [containerDimensions, onWheelScroll]
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
        const newScale = lastScale.value * scale
        lastScale.value = newScale
        if (newScale > 1) {
          isZoomedIn.value = true
          baseScale.value = newScale
          pinchScale.value = 1

          handlePanOutside()
        } else {
          zoomOut()
        }
      },
      [
        lastScale,
        baseScale,
        pinchScale,
        handlePanOutside,
        zoomOut,
        isZoomedIn,
      ]
    )

    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .numberOfTaps(2)
          .maxDelay(300)
          .maxDistance(10)
          .onEnd(() => {
            runOnJS(onDoubleTap)()
          }),
      [onDoubleTap]
    )

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .maxPointers(2)
          .onTouchesMove(
            (
              e: GestureTouchEvent,
              state: GestureStateManagerType
            ): void => {
              const isSingleTouch = e.numberOfTouches === 1

              // Only allow panning when zoomed in or single touch
              if (!isZoomedIn.value && !isSingleTouch) {
                state.fail()
                return
              }

              // Calculate total movement
              const deltaX = Math.abs(e.allTouches[0].absoluteX - startX.value)
              const deltaY = Math.abs(e.allTouches[0].absoluteY - startY.value)

              // Only activate if movement exceeds threshold
              if (e.state === State.UNDETERMINED || e.state === State.BEGAN)
                if (deltaX > panThreshold || deltaY > panThreshold)
                  state.activate()
                else
                  state.fail()

            }
          )
          .onStart(
            (
              event: GestureUpdateEvent<PanGestureHandlerEventPayload>
            ): void => {
              // Store initial touch position
              startX.value = event.absoluteX
              startY.value = event.absoluteY

              // Store initial translation for relative movement
              panStartOffsetX.value = event.translationX
              panStartOffsetY.value = event.translationY
            }
          )
          .onUpdate(
            (
              event: GestureUpdateEvent<PanGestureHandlerEventPayload>
            ): void => {
              // Calculate relative movement from start position
              const relativeX = event.translationX - panStartOffsetX.value
              const relativeY = event.translationY - panStartOffsetY.value

              // Apply movement scaled by current zoom level
              translateX.value = lastOffsetX.value + relativeX / lastScale.value
              translateY.value = lastOffsetY.value + relativeY / lastScale.value
            }
          )
          .onEnd(
            (
              event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
            ): void => {
              // Calculate final position
              const finalX = event.translationX - panStartOffsetX.value
              const finalY = event.translationY - panStartOffsetY.value

              // Update last known position
              lastOffsetX.value += finalX / lastScale.value
              lastOffsetY.value += finalY / lastScale.value

              runOnJS(handlePanOutside)()
            }
          ),
      [
        handlePanOutside,
        lastOffsetX,
        lastOffsetY,
        translateX,
        translateY,
        panStartOffsetX,
        panStartOffsetY,
        startX,
        startY,
        isZoomedIn,
        lastScale,
        panThreshold,
      ]
    )

    const pinchGesture = useMemo(
      () =>
        Gesture.Pinch()
          .onUpdate(
            ({
              scale,
            }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
              pinchScale.value = scale
            }
          )
          .onEnd(
            ({
              scale,
            }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
              pinchScale.value = scale

              runOnJS(onPinchEnd)(scale)
            }
          ),
      [pinchScale, onPinchEnd]
    )

    const composedGestures = useMemo(
      () => Gesture.Simultaneous(pinchGesture, panGesture),
      [pinchGesture, panGesture]
    )

    const zoomGestures = useMemo(
      () => Gesture.Exclusive(composedGestures, tapGesture),
      [composedGestures, tapGesture]
    )

    const animContentContainerStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: baseScale.value * pinchScale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    }))

    useImperativeHandle(
      ref,
      () => ({
        zoomIn,
        zoomOut,
        resetZoom,
      }),
      [resetZoom, zoomIn, zoomOut]
    )

    return (
      <GestureDetector gesture={zoomGestures}>
        <View
          style={[styles.container, style]}
          onLayout={onLayout}
          collapsable={false}
          ref={containerRef}
        >
          <Animated.View
            style={[
              animContentContainerStyle,
              contentContainerStyle,
            ]}
            onLayout={onLayoutContent}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    )
  }
)

export interface ZoomProps {
  style?: StyleProp<ViewProps>;
  contentContainerStyle?: StyleProp<ViewProps>;
  animationConfig?: object;

  animationFunction?<T extends AnimatableValue>(
    toValue: T,
    userConfig?: object,
    callback?: AnimationCallback
  ): T;
  panThreshold?: number;
  onZoomStateChange?(zoomState: boolean): void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
})
