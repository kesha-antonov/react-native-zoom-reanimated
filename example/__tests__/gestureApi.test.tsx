/**
 * Wiring tests for the react-native-gesture-handler v2 / v3 API selection.
 *
 * The example app itself depends on react-native-gesture-handler 2.x, so the v3 code path is
 * exercised here against a fake module that exposes the v3 gestures API surface.
 */
import React from 'react'
import { View } from 'react-native'
import { it, expect, describe, jest, beforeEach } from '@jest/globals'
import { render } from '@testing-library/react-native'

jest.unmock('react-native-zoom-reanimated')

// `jest.mock` factories are hoisted above module-level consts, so the State enum is defined
// inline inside the factory. This copy is only used by the assertions below.
const mockState = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
}

interface V3Config { [key: string]: unknown }

const mockV3Calls: {
  tap: V3Config[]
  pan: V3Config[]
  pinch: V3Config[]
  simultaneous: unknown[][]
} = { tap: [], pan: [], pinch: [], simultaneous: [] }

const mockStateManagerCalls: { activate: number[], fail: number[] } = { activate: [], fail: [] }

const mockV2Calls: { methods: string[], simultaneous: unknown[][] } = { methods: [], simultaneous: [] }

// Chainable recorder standing in for the v2 `Gesture.Pan()` builder API.
function mockCreateV2Builder(name: string) {
  const handlers: Record<string, unknown> = {}
  const target: Record<string, unknown> = { __name: name, __handlers: handlers }
  const proxy: Record<string, unknown> = new Proxy(target, {
    get(receiver, prop: string) {
      if (prop in receiver)
        return receiver[prop]

      return (...args: unknown[]) => {
        mockV2Calls.methods.push(`${name}.${prop}`)
        if (typeof args[0] === 'function')
          handlers[prop] = args[0]

        return proxy
      }
    },
  })

  return proxy
}

jest.mock('react-native-gesture-handler', () => {
  const RN = jest.requireActual<typeof import('react-native')>('react-native')

  return {
    State: {
      UNDETERMINED: 0,
      FAILED: 1,
      BEGAN: 2,
      CANCELLED: 3,
      ACTIVE: 4,
      END: 5,
    },
    GestureHandlerRootView: RN.View,
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    Gesture: {
      Tap: () => mockCreateV2Builder('Tap'),
      Pan: () => mockCreateV2Builder('Pan'),
      Pinch: () => mockCreateV2Builder('Pinch'),
      Simultaneous: (...gestures: unknown[]) => {
        mockV2Calls.simultaneous.push(gestures)
        return { __composed: gestures }
      },
    },
    // react-native-gesture-handler v3 gestures API
    useTapGesture: (config: V3Config) => {
      mockV3Calls.tap.push(config)
      return { handlerTag: 101, config }
    },
    usePanGesture: (config: V3Config) => {
      mockV3Calls.pan.push(config)
      return { handlerTag: 102, config }
    },
    usePinchGesture: (config: V3Config) => {
      mockV3Calls.pinch.push(config)
      return { handlerTag: 103, config }
    },
    useSimultaneousGestures: (...gestures: unknown[]) => {
      mockV3Calls.simultaneous.push(gestures)
      return { handlerTags: [101, 102, 103], gestures }
    },
    GestureStateManager: {
      activate: (tag: number) => mockStateManagerCalls.activate.push(tag),
      fail: (tag: number) => mockStateManagerCalls.fail.push(tag),
      deactivate: () => {},
    },
  }
})


import Zoom, {
  isGestureApiV3Supported,
  setGestureApiVersion,
  useZoomGesture,
  useZoomGestureV2,
  useZoomGestureV3,
  type UseZoomGestureReturnV2,
  type UseZoomGestureReturnV3,
} from 'react-native-zoom-reanimated'

function touchEvent(overrides: Record<string, unknown> = {}) {
  return {
    handlerTag: 102,
    numberOfTouches: 1,
    state: mockState.BEGAN,
    allTouches: [{ id: 0, x: 10, y: 10, absoluteX: 10, absoluteY: 10 }],
    changedTouches: [],
    ...overrides,
  }
}

async function renderHookResult<T>(useHook: () => T): Promise<T> {
  let result!: T

  function Probe() {
    result = useHook()
    return <View />
  }

  await render(<Probe />)

  return result
}

describe('gesture handler API selection', () => {
  beforeEach(() => {
    mockV3Calls.tap = []
    mockV3Calls.pan = []
    mockV3Calls.pinch = []
    mockV3Calls.simultaneous = []
    mockV2Calls.methods = []
    mockV2Calls.simultaneous = []
    mockStateManagerCalls.activate = []
    mockStateManagerCalls.fail = []
  })

  it('detects the v3 gestures API', () => {
    expect(isGestureApiV3Supported()).toBe(true)
  })

  it('useZoomGestureV2 builds the gesture with the v2 builder API', async () => {
    const result = await renderHookResult<UseZoomGestureReturnV2>(() => useZoomGestureV2())

    expect(result.zoomGesture).toBeTruthy()
    expect(mockV2Calls.simultaneous).toHaveLength(1)
    expect(mockV2Calls.simultaneous[0]).toHaveLength(3)
    expect(mockV2Calls.methods).toContain('Pan.manualActivation')
    expect(mockV2Calls.methods).toContain('Pinch.onUpdate')
    expect(mockV2Calls.methods).toContain('Tap.numberOfTaps')
    // The v2 path must not touch the v3 hooks
    expect(mockV3Calls.pan).toHaveLength(0)
  })

  it('useZoomGestureV3 builds the gesture with the v3 hooks API', async () => {
    const result = await renderHookResult<UseZoomGestureReturnV3>(() => useZoomGestureV3())

    expect(result.zoomGesture).toBeTruthy()
    expect(mockV3Calls.simultaneous).toHaveLength(1)
    expect(mockV3Calls.simultaneous[0]).toHaveLength(3)

    const panConfig = mockV3Calls.pan[0]
    expect(panConfig.manualActivation).toBe(true)
    expect(panConfig.minDistance).toBe(0)
    expect(panConfig.minPointers).toBe(1)
    expect(panConfig.maxPointers).toBe(2)
    expect(typeof panConfig.onActivate).toBe('function')
    expect(typeof panConfig.onUpdate).toBe('function')
    expect(typeof panConfig.onDeactivate).toBe('function')
    expect(typeof panConfig.onTouchesCancel).toBe('function')

    const tapConfig = mockV3Calls.tap[0]
    expect(tapConfig.numberOfTaps).toBe(2)
    expect(typeof tapConfig.onDeactivate).toBe('function')

    const pinchConfig = mockV3Calls.pinch[0]
    expect(typeof pinchConfig.onActivate).toBe('function')
    expect(typeof pinchConfig.onUpdate).toBe('function')
  })

  it('routes v3 manual pan activation through GestureStateManager', async () => {
    await renderHookResult<UseZoomGestureReturnV3>(() => useZoomGestureV3())

    const onTouchesMove = mockV3Calls.pan[0].onTouchesMove as (event: unknown) => void

    // Two fingers always activate (pinch + pan combo)
    onTouchesMove(touchEvent({ numberOfTouches: 2 }))
    expect(mockStateManagerCalls.activate).toEqual([102])
    expect(mockStateManagerCalls.fail).toEqual([])

    // One finger while not zoomed in lets the parent handle the gesture
    onTouchesMove(touchEvent({ numberOfTouches: 1 }))
    expect(mockStateManagerCalls.fail).toEqual([102])

    // Nothing to decide once the gesture is already active
    onTouchesMove(touchEvent({ numberOfTouches: 2, state: mockState.ACTIVE }))
    expect(mockStateManagerCalls.activate).toEqual([102])
  })

  it('activates the v3 pinch gesture on a second finger', async () => {
    await renderHookResult<UseZoomGestureReturnV3>(() => useZoomGestureV3())

    const onTouchesDown = mockV3Calls.pinch[0].onTouchesDown as (event: unknown) => void

    onTouchesDown(touchEvent({ handlerTag: 103, numberOfTouches: 1 }))
    expect(mockStateManagerCalls.activate).toEqual([])

    onTouchesDown(touchEvent({ handlerTag: 103, numberOfTouches: 2 }))
    expect(mockStateManagerCalls.activate).toEqual([103])
  })

  it('useZoomGesture auto-selects the v3 API when it is available', async () => {
    await renderHookResult(() => useZoomGesture())

    expect(mockV3Calls.simultaneous).toHaveLength(1)
    expect(mockV2Calls.simultaneous).toHaveLength(0)
  })

  it('useZoomGesture honours an explicit app-wide version', async () => {
    setGestureApiVersion('v2')
    try {
      await renderHookResult(() => useZoomGesture())

      expect(mockV2Calls.simultaneous).toHaveLength(1)
      expect(mockV3Calls.simultaneous).toHaveLength(0)
    }
    finally {
      setGestureApiVersion('auto')
    }
  })

  it('Zoom auto-selects the v3 API and honours an explicit gestureApi prop', async () => {
    await render(<Zoom><View /></Zoom>)
    expect(mockV3Calls.simultaneous).toHaveLength(1)
    expect(mockV2Calls.simultaneous).toHaveLength(0)

    await render(<Zoom gestureApi="v2"><View /></Zoom>)
    expect(mockV2Calls.simultaneous).toHaveLength(1)

    await render(<Zoom gestureApi="auto"><View /></Zoom>)
    expect(mockV3Calls.simultaneous).toHaveLength(2)
  })
})
