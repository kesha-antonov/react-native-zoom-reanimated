import React, { PropsWithChildren, useCallback, useMemo, useRef } from 'react'
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
import { GestureStateManagerType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager' // eslint-disable-line max-len
import Animated, {
  AnimatableValue,
  AnimationCallback,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated'
import { MAX_SCALE, MIN_SCALE } from './constants'
import { clampScale, getScaleFromDimensions } from './utils'

import styles from './styles'
export type AnimationConfigProps = Parameters<typeof withTiming>[1];
interface UseZoomGestureProps {
  animationFunction?: typeof withTiming;
  animationConfig?: AnimationConfigProps;
  doubleTapConfig?: {
    defaultScale?: number;
    minZoomScale?: number;
    maxZoomScale?: number;
  };
}

export function useZoomGesture(props: UseZoomGestureProps = {}): {
  zoomGesture: ComposedGesture;
  contentContainerAnimatedStyle: object;
  onLayout(event: LayoutChangeEvent): void;
  onLayoutContent(event: LayoutChangeEvent): void;
  zoomOut(): void;
  isZoomedIn: SharedValue<boolean>;
  zoomGestureLastTime: SharedValue<number>;
} {
  const {
    animationFunction = withTiming,
    animationConfig,
    doubleTapConfig,
  } = props

  const baseScale = useSharedValue(1)
  const pinchScale = useSharedValue(1)
  const lastScale = useSharedValue(1)
  const isZoomedIn = useSharedValue(false)
  const zoomGestureLastTime = useSharedValue(0)

  const containerDimensions = useSharedValue({ width: 0, height: 0 })
  const contentDimensions = useSharedValue({ width: 1, height: 1 })

  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const lastOffsetX = useSharedValue(0)
  const lastOffsetY = useSharedValue(0)
  const panStartOffsetX = useSharedValue(0)
  const panStartOffsetY = useSharedValue(0)
  const velocity = useSharedValue({ x: 0, y: 0 })

  // Focal point values for pinch gesture
  const pinchStartX = useSharedValue(0)
  const pinchStartY = useSharedValue(0)

  const handlePanOutsideTimeoutId: React.MutableRefObject<
    ReturnType<typeof setTimeout> | undefined
  > = useRef(undefined)

  const withAnimation = useCallback(
    (toValue: number, config?: AnimationConfigProps) => {
      'worklet'

      return animationFunction(toValue, {
        duration: 350,
        ...config,
        ...animationConfig,
      })
    },
    [animationFunction, animationConfig]
  )

  const getContentContainerSize = useCallback(() => {
    return {
      width: containerDimensions.value.width,
      height:
        (contentDimensions.value.height * containerDimensions.value.width) /
        contentDimensions.value.width,
    }
  }, [containerDimensions, contentDimensions])

  const zoomIn = useCallback((): void => {
    const { width, height } = getContentContainerSize()

    const newScale =
      doubleTapConfig?.defaultScale ?? getScaleFromDimensions(width, height)

    const clampedScale = clampScale(
      newScale,
      doubleTapConfig?.minZoomScale ?? MIN_SCALE,
      doubleTapConfig?.maxZoomScale ?? MAX_SCALE
    )

    lastScale.value = clampedScale

    baseScale.value = withAnimation(newScale)
    pinchScale.value = withAnimation(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = newOffsetX
    translateY.value = newOffsetY

    isZoomedIn.value = true
  }, [
    baseScale,
    pinchScale,
    lastOffsetX,
    lastOffsetY,
    translateX,
    translateY,
    isZoomedIn,
    lastScale,
    getContentContainerSize,
    withAnimation,
    doubleTapConfig,
  ])

  const zoomOut = useCallback((): void => {
    const newScale = 1
    lastScale.value = newScale

    baseScale.value = withAnimation(newScale)
    pinchScale.value = withAnimation(1)

    const newOffsetX = 0
    lastOffsetX.value = newOffsetX

    const newOffsetY = 0
    lastOffsetY.value = newOffsetY

    translateX.value = withAnimation(newOffsetX)
    translateY.value = withAnimation(newOffsetY)

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

  const handlePanOutside = useCallback((): void => {
    if (handlePanOutsideTimeoutId.current !== undefined)
      clearTimeout(handlePanOutsideTimeoutId.current)

    handlePanOutsideTimeoutId.current = setTimeout((): void => {
      const { width, height } = getContentContainerSize()
      const maxOffset = {
        x:
          width * lastScale.value < containerDimensions.value.width
            ? 0
            : (width * lastScale.value - containerDimensions.value.width) /
              2 /
              lastScale.value,
        y:
          height * lastScale.value < containerDimensions.value.height
            ? 0
            : (height * lastScale.value - containerDimensions.value.height) /
              2 /
              lastScale.value,
      }

      translateX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffset.x, maxOffset.x],
        rubberBandEffect: true,
      })
      translateY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffset.y, maxOffset.y],
        rubberBandEffect: true,
      })

      lastOffsetX.value = withDecay({
        velocity: velocity.value.x,
        clamp: [-maxOffset.x, maxOffset.x],
        rubberBandEffect: true,
      })
      lastOffsetY.value = withDecay({
        velocity: velocity.value.y,
        clamp: [-maxOffset.y, maxOffset.y],
        rubberBandEffect: true,
      })
    }, 10)
  }, [
    lastOffsetX,
    lastOffsetY,
    lastScale,
    translateX,
    translateY,
    containerDimensions,
    getContentContainerSize,
    velocity,
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
      containerDimensions.value = {
        width,
        height,
      }
    },
    [containerDimensions]
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
    [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut, isZoomedIn]
  )

  const updateZoomGestureLastTime = useCallback((): void => {
    'worklet'

    zoomGestureLastTime.value = Date.now()
  }, [zoomGestureLastTime])

  const zoomGesture = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onStart(() => {
        updateZoomGestureLastTime()
      })
      .onEnd(() => {
        updateZoomGestureLastTime()

        runOnJS(onDoubleTap)()
      })
      .maxDeltaX(25)
      .maxDeltaY(25)

    const panGesture = Gesture.Pan()
      .onStart(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          const { translationX, translationY } = event

          panStartOffsetX.value = translationX
          panStartOffsetY.value = translationY
        }
      )
      .onUpdate(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          let { translationX, translationY } = event

          translationX -= panStartOffsetX.value
          translationY -= panStartOffsetY.value

          translateX.value =
            lastOffsetX.value +
            translationX / lastScale.value / pinchScale.value
          translateY.value =
            lastOffsetY.value +
            translationY / lastScale.value / pinchScale.value
        }
      )
      .onEnd(
        (
          event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
        ): void => {
          updateZoomGestureLastTime()

          let { translationX, translationY } = event

          translationX -= panStartOffsetX.value
          translationY -= panStartOffsetY.value

          // Save the ending pan velocity for withDecay
          const { velocityX, velocityY } = event
          velocity.value = {
            x: velocityX / lastScale.value,
            y: velocityY / lastScale.value,
          }

          // SAVES LAST POSITION
          lastOffsetX.value =
            lastOffsetX.value + translationX / lastScale.value
          lastOffsetY.value =
            lastOffsetY.value + translationY / lastScale.value

          runOnJS(handlePanOutside)()
        }
      )
      .onTouchesMove(
        (e: GestureTouchEvent, state: GestureStateManagerType): void => {
          if (([State.UNDETERMINED, State.BEGAN] as State[]).includes(e.state))
            if (isZoomedIn.value || e.numberOfTouches === 2) state.activate()
            else state.fail()
        }
      )
      .onFinalize(() => {})
      .minDistance(0)
      .minPointers(2)
      .maxPointers(2)

    const pinchGesture = Gesture.Pinch()
      .onStart(({ focalX, focalY }: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        updateZoomGestureLastTime()

        // Store the focal point and current translation when pinch starts
        pinchStartX.value = translateX.value
        pinchStartY.value = translateY.value
      })
      .onUpdate(
        ({
          scale,
          focalX,
          focalY,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          pinchScale.value = scale

          // Calculate translation adjustment for focal point zooming
          const currentScale = lastScale.value * scale
          const prevScale = lastScale.value

          // Adjust translation to keep focal point stationary
          const focalAdjustmentX = (focalX - containerDimensions.value.width / 2) * (1 / currentScale - 1 / prevScale)
          const focalAdjustmentY = (focalY - containerDimensions.value.height / 2) * (1 / currentScale - 1 / prevScale)

          translateX.value = pinchStartX.value + focalAdjustmentX
          translateY.value = pinchStartY.value + focalAdjustmentY
        }
      )
      .onEnd(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          updateZoomGestureLastTime()

          pinchScale.value = scale

          runOnJS(onPinchEnd)(scale)
        }
      )
      .onFinalize(() => {})

    return Gesture.Simultaneous(tapGesture, panGesture, pinchGesture)
  }, [
    handlePanOutside,
    lastOffsetX,
    lastOffsetY,
    onDoubleTap,
    onPinchEnd,
    pinchScale,
    translateX,
    translateY,
    lastScale,
    isZoomedIn,
    panStartOffsetX,
    panStartOffsetY,
    updateZoomGestureLastTime,
    containerDimensions,
    pinchStartX,
    pinchStartY,
    velocity,
  ])

  const contentContainerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }))

  return {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
    isZoomedIn,
    zoomGestureLastTime,
  }
}

export default function Zoom(
  props: PropsWithChildren<ZoomProps>
): React.JSX.Element {
  const { style, contentContainerStyle, children, ...rest } = props

  const {
    zoomGesture,
    onLayout,
    onLayoutContent,
    contentContainerAnimatedStyle,
  } = useZoomGesture({
    ...rest,
  })

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={zoomGesture}>
        <View
          style={[styles.container, style]}
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

export interface ZoomProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  animationConfig?: AnimationConfigProps;
  doubleTapConfig?: {
    defaultScale?: number;
    minZoomScale?: number;
    maxZoomScale?: number;
  };

  animationFunction?<T extends AnimatableValue>(
    toValue: T,
    userConfig?: AnimationConfigProps,
    callback?: AnimationCallback,
  ): T;
}
