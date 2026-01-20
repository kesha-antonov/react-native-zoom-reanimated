// Jest setup file for react-native-zoom-reanimated example app

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  const RN = require('react-native')

  return {
    GestureHandlerRootView: ({ children, style }) =>
      React.createElement(RN.View, { style, testID: 'gesture-handler-root' }, children),
    GestureDetector: ({ children }) => children,
    Gesture: {
      Tap: () => ({
        numberOfTaps: () => ({ maxDeltaX: () => ({ maxDeltaY: () => ({ onEnd: () => ({}) }) }) }),
      }),
      Pan: () => ({
        manualActivation: () => ({
          onTouchesDown: () => ({
            onTouchesMove: () => ({
              onStart: () => ({
                onUpdate: () => ({
                  onEnd: () => ({
                    onTouchesCancelled: () => ({
                      minDistance: () => ({ minPointers: () => ({ maxPointers: () => ({}) }) }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
      Pinch: () => ({
        onTouchesDown: () => ({ onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }),
      }),
      Simultaneous: () => ({}),
    },
    State: { UNDETERMINED: 0, BEGAN: 1, ACTIVE: 2 },
  }
})

// Mock react-native-reanimated with comprehensive mock
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native')
  const React = require('react')

  const View = RN.View
  const Text = RN.Text
  const Image = RN.Image
  const ScrollView = RN.ScrollView
  const FlatList = RN.FlatList

  const hook = (init) => ({ value: init })

  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView,
      FlatList,
      createAnimatedComponent: (comp) => comp,
    },
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    createAnimatedComponent: (comp) => comp,
    useSharedValue: hook,
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn) => ({ value: typeof fn === 'function' ? fn() : fn }),
    useAnimatedGestureHandler: () => ({}),
    useAnimatedScrollHandler: () => ({}),
    useAnimatedRef: () => React.createRef(),
    useAnimatedReaction: () => {},
    useWorkletCallback: (fn) => fn,
    useAnimatedProps: () => ({}),
    withTiming: (val) => val,
    withSpring: (val) => val,
    withDecay: () => 0,
    withSequence: () => 0,
    withRepeat: () => 0,
    withDelay: (_, val) => val,
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    cancelAnimation: () => {},
    Easing: {
      linear: (v) => v,
      ease: (v) => v,
      bezier: () => (v) => v,
      in: (v) => v,
      out: (v) => v,
      inOut: (v) => v,
    },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    interpolate: (val) => val,
    clamp: (val, min, max) => Math.min(max, Math.max(min, val)),
    measure: () => ({ width: 0, height: 0, x: 0, y: 0, pageX: 0, pageY: 0 }),
    scrollTo: () => {},
  }
})

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  const RN = require('react-native')

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, style }) =>
      React.createElement(RN.View, { style, testID: 'safe-area-view' }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  }
})

// Mock react-native-zoom-reanimated (the library itself)
jest.mock('react-native-zoom-reanimated', () => {
  const React = require('react')
  const RN = require('react-native')

  const Zoom = ({ children, style }) =>
    React.createElement(RN.View, { style, testID: 'zoom-component' }, children)

  const useZoomGesture = () => ({
    zoomGesture: {},
    contentContainerAnimatedStyle: {},
    onLayout: () => {},
    onLayoutContent: () => {},
    zoomOut: () => {},
    isZoomedIn: { value: false },
    zoomGestureLastTime: { value: 0 },
  })

  return {
    __esModule: true,
    default: Zoom,
    useZoomGesture,
  }
})

// Mock expo-image
jest.mock('expo-image', () => {
  const RN = require('react-native')
  return {
    Image: RN.Image,
  }
})
