import { useState } from 'react'
import { resolveGestureApiVersion } from './gestureApi'
import { useZoomGestureV2 } from './useZoomGestureV2'
import { useZoomGestureV3 } from './useZoomGestureV3'
import type { UseZoomGestureProps, UseZoomGestureReturn } from './types'

/**
 * Apple Photos-style zoom gesture, built with whichever react-native-gesture-handler gestures
 * API the installed version provides: the v3 hooks API on react-native-gesture-handler 3.x,
 * the v2 builder API on 2.x.
 *
 * `setGestureApiVersion('v2' | 'v3')` overrides that choice app-wide, and `useZoomGestureV2` /
 * `useZoomGestureV3` pin it for a single call site.
 *
 * The type of the returned `zoomGesture` follows the same rule at compile time, so it is always
 * accepted by the `GestureDetector` of the installed version.
 */
export function useZoomGesture(props: UseZoomGestureProps = {}): UseZoomGestureReturn {
  // Which API a given component uses is frozen on its first render, so the hooks called below
  // never change between renders of that component - even if the app-wide default is changed
  // later. That is what makes the branch safe despite the rules-of-hooks warning.
  const [version] = useState(resolveGestureApiVersion)

  /* eslint-disable react-hooks/rules-of-hooks */
  const zoom = version === 'v3'
    ? useZoomGestureV3(props)
    : useZoomGestureV2(props)
  /* eslint-enable react-hooks/rules-of-hooks */

  return zoom as UseZoomGestureReturn
}
