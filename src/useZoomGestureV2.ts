import { useMemo } from 'react'
import {
  Gesture,
  type GestureStateChangeEvent,
  type GestureTouchEvent,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
  type PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler'
import { useZoomGestureCore } from './useZoomGestureCore'
import type { UseZoomGestureProps, UseZoomGestureReturnV2 } from './types'

/**
 * Apple Photos-style zoom gesture built with the react-native-gesture-handler v2
 * `Gesture.Pan()` / `Gesture.Pinch()` builder API.
 *
 * Works with react-native-gesture-handler 2.x and 3.x, since 3.x still ships the v2 API.
 * Use `useZoomGestureV3` instead when you need to compose the zoom gesture with gestures
 * created by the v3 hooks API.
 */
export function useZoomGestureV2(props: UseZoomGestureProps = {}): UseZoomGestureReturnV2 {
  const {
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
    ...rest
  } = useZoomGestureCore(props)

  const zoomGesture = useMemo(() => {
    // ========== DOUBLE TAP ==========
    const tapGesture = Gesture.Tap()
      .numberOfTaps(tapConfig.numberOfTaps)
      .maxDeltaX(tapConfig.maxDeltaX)
      .maxDeltaY(tapConfig.maxDeltaY)
      .onEnd((event) => {
        'worklet'
        handleTapEnd(event)
      })

    // ========== PAN GESTURE ==========
    const panGesture = Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown((e: GestureTouchEvent) => {
        'worklet'
        handlePanTouchesDown(e)
      })
      .onTouchesMove((e: GestureTouchEvent, state) => {
        'worklet'
        const decision = decidePanActivation(e)

        if (decision === 'activate')
          state.activate()
        else if (decision === 'fail')
          state.fail()
      })
      .onStart(() => {
        'worklet'
        handlePanStart()
      })
      .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        handlePanUpdate(event)
      })
      .onEnd((event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        'worklet'
        handlePanEnd(event)
      })
      .onTouchesCancelled(() => {
        'worklet'
        handlePanTouchesCancelled()
      })
      .minDistance(panConfig.minDistance)
      .minPointers(panConfig.minPointers)
      .maxPointers(panConfig.maxPointers)

    // ========== PINCH GESTURE ==========
    const pinchGesture = Gesture.Pinch()
      .onTouchesDown((e: GestureTouchEvent, state) => {
        'worklet'
        if (shouldActivatePinch(e))
          state.activate()
      })
      .onStart((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'
        handlePinchStart(event)
      })
      .onUpdate((event: GestureUpdateEvent<PinchGestureHandlerEventPayload>) => {
        'worklet'
        handlePinchUpdate(event)
      })
      .onEnd(() => {
        'worklet'
        handlePinchEnd()
      })

    return Gesture.Simultaneous(tapGesture, panGesture, pinchGesture)
  }, [
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
  ])

  return { zoomGesture, ...rest }
}
