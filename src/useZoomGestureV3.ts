import { useMemo } from 'react'
import type { GestureTouchEvent } from 'react-native-gesture-handler'
import {
  requireGestureApiV3,
  type V3PanConfig,
  type V3PanEvent,
  type V3PinchConfig,
  type V3PinchEvent,
  type V3TapConfig,
  type V3TapEvent,
} from './gestureApi'
import { useZoomGestureCore } from './useZoomGestureCore'
import type { UseZoomGestureProps, UseZoomGestureReturnV3 } from './types'

/**
 * Apple Photos-style zoom gesture built with the react-native-gesture-handler v3 hooks API
 * (`useTapGesture` / `usePanGesture` / `usePinchGesture`).
 *
 * Requires react-native-gesture-handler >= 3 and throws otherwise. Use this when the rest of
 * your app builds gestures with the v3 hooks, so the zoom gesture can take part in v3
 * relations and compositions.
 */
export function useZoomGestureV3(props: UseZoomGestureProps = {}): UseZoomGestureReturnV3 {
  const {
    useTapGesture,
    usePanGesture,
    usePinchGesture,
    useSimultaneousGestures,
    GestureStateManager,
  } = requireGestureApiV3()

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

  // ========== DOUBLE TAP ==========
  const tapGestureConfig = useMemo<V3TapConfig>(() => ({
    numberOfTaps: tapConfig.numberOfTaps,
    maxDeltaX: tapConfig.maxDeltaX,
    maxDeltaY: tapConfig.maxDeltaY,
    onDeactivate: (event: V3TapEvent) => {
      'worklet'
      handleTapEnd(event)
    },
  }), [tapConfig, handleTapEnd])

  // ========== PAN GESTURE ==========
  const panGestureConfig = useMemo<V3PanConfig>(() => ({
    manualActivation: true,
    minDistance: panConfig.minDistance,
    minPointers: panConfig.minPointers,
    maxPointers: panConfig.maxPointers,
    onTouchesDown: (e: GestureTouchEvent) => {
      'worklet'
      handlePanTouchesDown(e)
    },
    onTouchesMove: (e: GestureTouchEvent) => {
      'worklet'
      const decision = decidePanActivation(e)

      if (decision === 'activate')
        GestureStateManager.activate(e.handlerTag)
      else if (decision === 'fail')
        GestureStateManager.fail(e.handlerTag)
    },
    onActivate: () => {
      'worklet'
      handlePanStart()
    },
    onUpdate: (event: V3PanEvent) => {
      'worklet'
      handlePanUpdate(event)
    },
    onDeactivate: (event: V3PanEvent) => {
      'worklet'
      handlePanEnd(event)
    },
    onTouchesCancel: () => {
      'worklet'
      handlePanTouchesCancelled()
    },
  }), [
    panConfig,
    GestureStateManager,
    handlePanTouchesDown,
    decidePanActivation,
    handlePanStart,
    handlePanUpdate,
    handlePanEnd,
    handlePanTouchesCancelled,
  ])

  // ========== PINCH GESTURE ==========
  const pinchGestureConfig = useMemo<V3PinchConfig>(() => ({
    onTouchesDown: (e: GestureTouchEvent) => {
      'worklet'
      if (shouldActivatePinch(e))
        GestureStateManager.activate(e.handlerTag)
    },
    onActivate: (event: V3PinchEvent) => {
      'worklet'
      handlePinchStart(event)
    },
    onUpdate: (event: V3PinchEvent) => {
      'worklet'
      handlePinchUpdate(event)
    },
    onDeactivate: () => {
      'worklet'
      handlePinchEnd()
    },
  }), [
    GestureStateManager,
    shouldActivatePinch,
    handlePinchStart,
    handlePinchUpdate,
    handlePinchEnd,
  ])

  const tapGesture = useTapGesture(tapGestureConfig)
  const panGesture = usePanGesture(panGestureConfig)
  const pinchGesture = usePinchGesture(pinchGestureConfig)

  const zoomGesture = useSimultaneousGestures(tapGesture, panGesture, pinchGesture)

  return { zoomGesture, ...rest }
}
