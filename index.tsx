import React, {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  Platform,
} from "react-native";
import Animated, {
  AnimatableValue,
  AnimationCallback,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
  State,
} from "react-native-gesture-handler";
import { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";

export interface ZoomRef {
  zoomIn: () => void;
  zoomOut: () => void;
}

export default forwardRef<ZoomRef, PropsWithChildren<ZoomProps>>(function Zoom(
  props,
  ref
) {
  const {
    style,
    contentContainerStyle,
    children,
    animationFunction = withTiming,
    animationConfig,
  } = props;

  const baseScale = useSharedValue(1);
  const pinchScale = useSharedValue(1);
  const lastScale = useSharedValue(1);
  const isZoomedIn = useSharedValue(false);

  const containerDimensions = useSharedValue({ width: 0, height: 0 });
  const contentDimensions = useSharedValue({ width: 1, height: 1 });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastOffsetX = useSharedValue(0);
  const lastOffsetY = useSharedValue(0);
  const panStartOffsetX = useSharedValue(0);
  const panStartOffsetY = useSharedValue(0);

  const handlePanOutsideTimeoutId: React.MutableRefObject<number | undefined> =
    useRef();

  const containerRef = useRef<View>(null);
  const scrollWheelSubscriptionRef = useRef<number | null>(null);

  const withAnimation = useCallback(
    (toValue: number, config?: object) => {
      "worklet";

      return animationFunction(toValue, {
        duration: 350,
        ...config,
        ...animationConfig,
      });
    },
    [animationFunction, animationConfig]
  );

  const onWheelScroll = useCallback(
    (event: WheelEvent) => {
      const scaleFactor = event.deltaY * -0.01;
      const newScale = lastScale.value + scaleFactor;
      const newSafeScale = Math.max(0.25, Math.min(newScale, 4));
      lastScale.value = newSafeScale;
      baseScale.value = withAnimation(newSafeScale);
    },
    [baseScale, lastScale, withAnimation]
  );

  const getContentContainerSize = useCallback(() => {
    return {
      width: containerDimensions.value.width,
      height:
        (contentDimensions.value.height * containerDimensions.value.width) /
        contentDimensions.value.width,
    };
  }, [containerDimensions]);

  const zoomIn = useCallback((): void => {
    const { width, height } = getContentContainerSize();

    // TODO: MAKE SMARTER CHOICE BASED ON AVAILABLE FREE VERTICAL SPACE
    let newScale =
      width > height ? (width / height) * 0.8 : (height / width) * 0.8;
    if (newScale < 1.4) newScale = 1.4;
    else if (newScale > 1.5) newScale = 1.5;

    lastScale.value = newScale;

    baseScale.value = withAnimation(newScale);
    pinchScale.value = withAnimation(1);

    const newOffsetX = 0;
    lastOffsetX.value = newOffsetX;

    const newOffsetY = 0;
    lastOffsetY.value = newOffsetY;

    translateX.value = newOffsetX;
    translateY.value = newOffsetY;

    isZoomedIn.value = true;
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
  ]);

  const zoomOut = useCallback((): void => {
    const newScale = 1;
    lastScale.value = newScale;

    baseScale.value = withAnimation(newScale);
    pinchScale.value = withAnimation(1);

    const newOffsetX = 0;
    lastOffsetX.value = newOffsetX;

    const newOffsetY = 0;
    lastOffsetY.value = newOffsetY;

    translateX.value = withAnimation(newOffsetX);
    translateY.value = withAnimation(newOffsetY);

    isZoomedIn.value = false;
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
  ]);

  const handlePanOutside = useCallback((): void => {
    if (handlePanOutsideTimeoutId.current !== undefined)
      clearTimeout(handlePanOutsideTimeoutId.current);

    handlePanOutsideTimeoutId.current = setTimeout((): void => {
      const { width, height } = getContentContainerSize();
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
      };

      const isPanedXOutside =
        lastOffsetX.value > maxOffset.x || lastOffsetX.value < -maxOffset.x;
      if (isPanedXOutside) {
        const newOffsetX = lastOffsetX.value >= 0 ? maxOffset.x : -maxOffset.x;
        lastOffsetX.value = newOffsetX;

        translateX.value = withAnimation(newOffsetX);
      } else {
        translateX.value = lastOffsetX.value;
      }

      const isPanedYOutside =
        lastOffsetY.value > maxOffset.y || lastOffsetY.value < -maxOffset.y;
      if (isPanedYOutside) {
        const newOffsetY = lastOffsetY.value >= 0 ? maxOffset.y : -maxOffset.y;
        lastOffsetY.value = newOffsetY;

        translateY.value = withAnimation(newOffsetY);
      } else {
        translateY.value = lastOffsetY.value;
      }
    }, 10);
  }, [
    lastOffsetX,
    lastOffsetY,
    lastScale,
    translateX,
    translateY,
    containerDimensions,
    getContentContainerSize,
    withAnimation,
  ]);

  const onDoubleTap = useCallback((): void => {
    if (isZoomedIn.value) zoomOut();
    else zoomIn();
  }, [zoomIn, zoomOut, isZoomedIn]);

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
      ) {
        scrollWheelSubscriptionRef.current =
          containerRef.current.addEventListener("wheel", onWheelScroll);
      }
      containerDimensions.value = {
        width,
        height,
      };
    },
    [containerDimensions]
  );

  const onLayoutContent = useCallback(
    ({
      nativeEvent: {
        layout: { width, height },
      },
    }: LayoutChangeEvent): void => {
      contentDimensions.value = {
        width,
        height,
      };
    },
    [contentDimensions]
  );

  const onPinchEnd = useCallback(
    (scale: number): void => {
      const newScale = lastScale.value * scale;
      lastScale.value = newScale;
      if (newScale > 1) {
        isZoomedIn.value = true;
        baseScale.value = newScale;
        pinchScale.value = 1;

        handlePanOutside();
      } else {
        zoomOut();
      }
    },
    [lastScale, baseScale, pinchScale, handlePanOutside, zoomOut, isZoomedIn]
  );

  const panOffsetsBeforeGestureStart: SharedValue<{
    x: number | null;
    y: number | null;
  }> = useSharedValue({
    x: null,
    y: null,
  });

  const zoomGestures = useMemo(() => {
    const tapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        runOnJS(onDoubleTap)();
      });

    const panGesture = Gesture.Pan()
      .onStart(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          panStartOffsetX.value = event.translationX;
          panStartOffsetY.value = event.translationY;
        }
      )
      .onUpdate(
        (event: GestureUpdateEvent<PanGestureHandlerEventPayload>): void => {
          let { translationX, translationY } = event;

          if (
            panOffsetsBeforeGestureStart.value.x === null ||
            panOffsetsBeforeGestureStart.value.y === null
          ) {
            panOffsetsBeforeGestureStart.value.x = translationX;
            panOffsetsBeforeGestureStart.value.y = translationY;
          }

          translationX -= panOffsetsBeforeGestureStart.value.x;
          translationY -= panOffsetsBeforeGestureStart.value.y;
          translationX -= panStartOffsetX.value;
          translationY -= panStartOffsetY.value;

          translateX.value = lastOffsetX.value + translationX / lastScale.value;
          translateY.value = lastOffsetY.value + translationY / lastScale.value;
        }
      )
      .onEnd(
        (
          event: GestureStateChangeEvent<PanGestureHandlerEventPayload>
        ): void => {
          let { translationX, translationY } = event;

          if (
            panOffsetsBeforeGestureStart.value.x !== null &&
            panOffsetsBeforeGestureStart.value.y !== null
          ) {
            translationX -= panOffsetsBeforeGestureStart.value.x;
            translationY -= panOffsetsBeforeGestureStart.value.y;
          }
          translationX -= panStartOffsetX.value;
          translationY -= panStartOffsetY.value;

          // SAVES LAST POSITION
          lastOffsetX.value =
            lastOffsetX.value + translationX / lastScale.value;
          lastOffsetY.value =
            lastOffsetY.value + translationY / lastScale.value;

          panOffsetsBeforeGestureStart.value.x = null;
          panOffsetsBeforeGestureStart.value.y = null;

          runOnJS(handlePanOutside)();
        }
      )
      .onTouchesMove(
        (e: GestureTouchEvent, state: GestureStateManagerType): void => {
          if ([State.UNDETERMINED, State.BEGAN].includes(e.state))
            if (isZoomedIn.value || e.numberOfTouches === 2) state.activate();
            else state.fail();
        }
      )
      .minDistance(0)
      .minPointers(2)
      .maxPointers(2);

    const pinchGesture = Gesture.Pinch()
      .onUpdate(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          pinchScale.value = scale;
        }
      )
      .onEnd(
        ({
          scale,
        }: GestureUpdateEvent<PinchGestureHandlerEventPayload>): void => {
          pinchScale.value = scale;

          runOnJS(onPinchEnd)(scale);
        }
      );

    return Gesture.Race(
      Gesture.Simultaneous(pinchGesture, panGesture),
      tapGesture
    );
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
    panOffsetsBeforeGestureStart,
  ]);

  const animContentContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: baseScale.value * pinchScale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
  }), [zoomIn, zoomOut]);

  return (
    <GestureDetector gesture={zoomGestures}>
      <View
        style={[styles.container, style]}
        onLayout={onLayout}
        collapsable={false}
        ref={containerRef}
      >
        <Animated.View
          style={[animContentContainerStyle, contentContainerStyle]}
          onLayout={onLayoutContent}
        >
          {children}
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

export interface ZoomProps {
  style?: StyleProp<ViewProps>;
  contentContainerStyle?: StyleProp<ViewProps>;
  animationConfig?: object;

  animationFunction?<T extends AnimatableValue>(
    toValue: T,
    userConfig?: object,
    callback?: AnimationCallback
  ): T;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
