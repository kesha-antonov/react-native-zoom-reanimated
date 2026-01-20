# react-native-zoom-reanimated

Zoom component on React Native + react-native-reanimated + react-native-gesture-handler

* You can zoom any View, Image or whatever
* Can be used in FlatList (see Preview below)
* Double tap to zoom in or zoom out
* Automatically bounces to borders when paning outside of container and leaving the touch

## Preview

<p float="left">
  <video src="https://user-images.githubusercontent.com/11584712/174407015-2cd13692-a32e-4591-8cce-b47f6edb3cb9.mp4" width="300" />
  <video src="https://github.com/kesha-antonov/react-native-zoom-reanimated/assets/11584712/7e8a572b-8130-4aea-88c7-2ca035a155a1" width="300" />
</p>

## Platform Support

- **iOS**: Full support for pinch-to-zoom, pan, and double-tap gestures
- **Android**: Full support including:
  - Reliable pinch-to-zoom inside horizontal FlatList (fixed in v2.2.0, see [#50](https://github.com/kesha-antonov/react-native-zoom-reanimated/issues/50))
  - Smooth spring animations during zoom transitions (fixed in v2.2.0, see [#51](https://github.com/kesha-antonov/react-native-zoom-reanimated/issues/51))

## Getting started

Install the library using either Yarn:

```bash
yarn add react-native-zoom-reanimated
```

or npm:

```bash
npm install --save react-native-zoom-reanimated
```

## Required peer dependencies

|          dependency          | required version |
|:----------------------------:|:----------------:|
|   react-native-reanimated    |    \>= 2.0.0     |
| react-native-gesture-handler |      \>= *       |


## Usage

```javascript
import Zoom from 'react-native-zoom-reanimated'

// For Apple Photos-style gallery, also import ScrollableRef type
import Zoom, { ScrollableRef } from 'react-native-zoom-reanimated'
```

## Examples

> 📁 See the [`example/`](./example) directory for complete working examples.

### Basic Usage

```jsx
import Zoom from 'react-native-zoom-reanimated'

<Zoom>
  <Image
    source={{ uri: imageUri }}
    resizeMode="contain"
    style={{ width: deviceWidth, height: imageHeight * deviceWidth / imageWidth }}
  />
</Zoom>
```

### Image Gallery with FlatList

Basic horizontal gallery with paging:

```jsx
<FlatList
  data={IMAGES}
  horizontal
  pagingEnabled
  renderItem={({ item }) => (
    <View style={{ width: screenWidth }}>
      <Zoom>
        <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      </Zoom>
    </View>
  )}
/>
```

> 📄 Full example: [`example/ImageGalleryStandalone.tsx`](./example/ImageGalleryStandalone.tsx)

### Apple Photos-Style Gallery

For seamless swipe navigation while zoomed — just like Apple Photos:

```jsx
<Zoom
  enableSwipeToClose
  parentScrollRef={flatListRef}
  currentIndex={index}
  itemWidth={deviceWidth + IMAGE_GAP}
>
  <Image source={{ uri: imageUri }} />
</Zoom>
```

Features:
- Swipe between images even while zoomed in
- Smooth edge-to-scroll transition
- Auto zoom reset when changing images
- Gap between images

> 📄 Full example: [`example/FlatListExample.tsx`](./example/FlatListExample.tsx) — complete implementation with all features

### Using the Hook Directly

For advanced control, use `useZoomGesture` hook:

```jsx
import { useZoomGesture } from 'react-native-zoom-reanimated'

const { zoomGesture, contentContainerAnimatedStyle, onLayout, onLayoutContent, zoomOut, isZoomedIn } = useZoomGesture({
  minScale: 1,
  maxScale: 5,
  onZoomStateChange: (isZoomed) => console.log('Zoomed:', isZoomed),
})
```

> 📄 Full example: [`example/UseZoomGestureExample.tsx`](./example/UseZoomGestureExample.tsx)

## Parameters

### Zoom Component Props

| Name                  | Type                   | Required | Description                                                                                                                                                                                                              |
|-----------------------|------------------------|----------|------------------|
| style                 | `StyleProp<ViewStyle>` | No       | Container style |
| contentContainerStyle | `StyleProp<ViewStyle>` | No       | Content container style |
| minScale              | `number`               | No       | Minimum allowed zoom scale. Default is `1`. Set to `1` to prevent zooming out smaller than initial size. Set to a value < 1 (e.g., `0.5`) to allow zooming out to 50% |
| maxScale              | `number`               | No       | Maximum allowed zoom scale. Default is `4` |
| onZoomStateChange     | `(isZoomed: boolean) => void` | No | Callback fired when zoom state changes. Called with `true` when zoomed in, `false` when zoomed out to initial scale |
| enableSwipeToClose    | `boolean`              | No       | Enable Apple Photos-style horizontal swipe to pass through to parent (e.g., FlatList) when at edge. When zoomed and panning hits horizontal boundary, continued swipe in same direction allows parent scroll to take over. Default is `false` |
| parentScrollRef       | `RefObject<ScrollableRef>` | No   | Reference to parent FlatList/ScrollView for seamless edge scrolling. When provided with `enableSwipeToClose`, enables Apple Photos-style continuous swipe: zoomed image pans to edge, then seamlessly scrolls parent list. Compatible with FlatList/ScrollView from `react-native`, `react-native-gesture-handler`, and `react-native-reanimated` |
| currentIndex          | `number`               | No       | Current index in the parent list (for calculating scroll offset). Required when using `parentScrollRef` |
| itemWidth             | `number`               | No       | Width of each item in the parent list (for calculating scroll offset). Required when using `parentScrollRef`. Usually equals `deviceWidth + imageGap` |
| animationFunction     | function               | No       | Animation function from `react-native-reanimated`. Default: `withTiming`. For example, you can use `withSpring` instead: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring |
| animationConfig       | object                 | No       | Config for animation function from `react-native-reanimated`. For example, avaiable options for `withSpring` animation: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring#options-object |
| doubleTapConfig       | `DoubleTapConfig`      | No       | Config for zoom on double tap. See below for details |

### DoubleTapConfig

| Name          | Type     | Required | Description |
|---------------|----------|----------|-------------|
| defaultScale  | `number` | No       | Fixed zoom scale on double tap. If not set, calculated based on dimensions |
| minZoomScale  | `number` | No       | Minimum zoom scale for double tap |
| maxZoomScale  | `number` | No       | Maximum zoom scale for double tap |

### ScrollableRef

Type for `parentScrollRef`. Compatible with FlatList/ScrollView from multiple libraries:

```typescript
interface ScrollableRef {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void  // FlatList
  scrollTo?: (params: { x?: number; y?: number; animated?: boolean }) => void // ScrollView
}
```

## Advanced Usage: useZoomGesture Hook

For advanced use cases, use the `useZoomGesture` hook directly for full control.

> 📄 See [`example/UseZoomGestureExample.tsx`](./example/UseZoomGestureExample.tsx) for a complete example.

### Hook API

```typescript
interface UseZoomGestureProps {
  animationFunction?: typeof withTiming  // Animation function (default: withTiming)
  animationConfig?: object               // Configuration for animation function
  minScale?: number                      // Minimum allowed zoom scale (default: 1)
  maxScale?: number                      // Maximum allowed zoom scale (default: 4)
  onZoomStateChange?: (isZoomed: boolean) => void  // Callback when zoom state changes
  enableSwipeToClose?: boolean           // Enable Apple Photos-style swipe (default: false)
  parentScrollRef?: RefObject<ScrollableRef>  // Parent FlatList/ScrollView ref for seamless scrolling
  currentIndex?: number                  // Current index in parent list
  itemWidth?: number                     // Width of each item in parent list
  doubleTapConfig?: DoubleTapConfig      // Double tap zoom configuration
}

interface UseZoomGestureReturn {
  zoomGesture: ComposedGesture              // Gesture handler to attach to GestureDetector
  contentContainerAnimatedStyle: object     // Animated styles for the content container
  onLayout: (event: LayoutChangeEvent) => void         // Container layout handler
  onLayoutContent: (event: LayoutChangeEvent) => void  // Content layout handler
  zoomOut: () => void                       // Programmatically zoom out
  isZoomedIn: SharedValue<boolean>          // Shared value indicating zoom state
  zoomGestureLastTime: SharedValue<number>  // Timestamp of last gesture interaction
}
```

### Basic Hook Usage

```jsx
import { useZoomGesture } from 'react-native-zoom-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

function MyCustomZoomComponent() {
  const {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
    isZoomedIn,
  } = useZoomGesture({
    doubleTapConfig: { defaultScale: 3, minZoomScale: 1, maxZoomScale: 10 },
  })

  return (
    <GestureDetector gesture={zoomGesture}>
      <View onLayout={onLayout}>
        <Animated.View style={contentContainerAnimatedStyle} onLayout={onLayoutContent}>
          {/* Your zoomable content */}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}
```


## License

The library is released under the MIT licence. For more information see [`LICENSE`](/LICENSE).

## TODO

- make list component with https://github.com/callstack/react-native-pager-view and export it for galleries usecase
