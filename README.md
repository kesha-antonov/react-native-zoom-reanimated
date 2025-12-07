# react-native-zoom-reanimated

Zoom component on React Native + react-native-reanimated + react-native-gesture-handler

* You can zoom any View, Image or whatever
* Can be used in FlatList (see Preview below)
* Double tap to zoom in or zoom out
* Automatically bounces to borders when paning outside of container and leaving the touch

## Preview

**iOS preview**

[iOS Preview](https://user-images.githubusercontent.com/11584712/174407015-2cd13692-a32e-4591-8cce-b47f6edb3cb9.mp4)

**Android preview**

[Android Preview](https://github.com/kesha-antonov/react-native-zoom-reanimated/assets/11584712/7e8a572b-8130-4aea-88c7-2ca035a155a1)

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
```

## Example

### Basic Usage

```jsx
import Zoom from 'react-native-zoom-reanimated'

...
  <Zoom>
    <Image
      source={{ uri: ... }}
      resizeMode='contain'
      style={{
        width: deviceWidth,
        height: imageHeight * deviceWidth / imageWidth,
       }}
    />
  </Zoom>
...
```

### Image Gallery with FlatList (Sliding Pages)

```jsx
import React from 'react'
import { FlatList, Image, useWindowDimensions, View } from 'react-native'
import Zoom from 'react-native-zoom-reanimated'

const IMAGES = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
  // ... more images
]

export default function ImageGallery () {
  const { width: screenWidth } = useWindowDimensions()

  const renderImage = ({ item: imageUri }) => (
    <View style={{ width: screenWidth }}>
      <Zoom>
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Zoom>
    </View>
  )

  return (
    <FlatList
      data={IMAGES}
      renderItem={renderImage}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
    />
  )
}
```

> See the `example/` directory for complete working examples, including `FlatListExample.tsx` and `ImageGalleryStandalone.tsx`.

## Parameters

### Zoom Component Props

| Name                  | Type                   | Required | Description                                                                                                                                                                                                              |
|-----------------------|------------------------|----------|------------------|
| style                 | `StyleProp<ViewStyle>` | No       | Container style |
| contentContainerStyle | `StyleProp<ViewStyle>` | No       | Content container style |
| animationFunction     | function               | No       | Animation function from `react-native-reanimated`. Default: `withTiming`. For example, you can use `withSpring` instead: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring |
| animationConfig       | object                 | No       | Config for animation function from `react-native-reanimated`. For example, avaiable options for `withSpring` animation: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring#options-object |
| doubleTapConfig       | { defaultScale?: number, minZoomScale?: number, maxZoomScale?: number } | No | Config for zoom on double tap. `defaultScale` - if you want to have fixed zoom on double tap, or calculated based on dimensions then leave it as it is. `minZoomScale` and `maxZoomScale` define range with min zoom & max zoom on double tap |

## Advanced Usage: useZoomGesture Hook

For advanced use cases where you need more control over the zoom behavior or want to integrate zoom functionality into your custom components, you can use the `useZoomGesture` hook directly.

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
    doubleTapConfig: {
      defaultScale: 3,
      minZoomScale: 1,
      maxZoomScale: 10,
    },
  })

  return (
    <GestureDetector gesture={zoomGesture}>
      <View onLayout={onLayout}>
        <Animated.View
          style={contentContainerAnimatedStyle}
          onLayout={onLayoutContent}
        >
          {/* Your zoomable content */}
        </Animated.View>
      </View>
    </GestureDetector>
  )
}
```

### useZoomGesture API

#### Parameters

```typescript
interface UseZoomGestureProps {
  animationFunction?: typeof withTiming  // Animation function (default: withTiming)
  animationConfig?: object               // Configuration for animation function
  doubleTapConfig?: {
    defaultScale?: number    // Default zoom scale on double tap
    minZoomScale?: number    // Minimum zoom scale (default: 1.4)
    maxZoomScale?: number    // Maximum zoom scale (default: 4)
  }
}
```

#### Return Value

```typescript
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

### Advanced Example: Custom Zoom with Controls

```jsx
import React from 'react'
import { View, Button } from 'react-native'
import { useZoomGesture } from 'react-native-zoom-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'

function ZoomableImageWithControls({ imageUri }) {
  const {
    zoomGesture,
    contentContainerAnimatedStyle,
    onLayout,
    onLayoutContent,
    zoomOut,
    isZoomedIn,
  } = useZoomGesture({
    doubleTapConfig: {
      defaultScale: 2.5,
      minZoomScale: 1,
      maxZoomScale: 5,
    },
  })

  const handleResetZoom = () => {
    if (isZoomedIn.value) {
      zoomOut()
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={zoomGesture}>
        <View style={{ flex: 1 }} onLayout={onLayout}>
          <Animated.View
            style={contentContainerAnimatedStyle}
            onLayout={onLayoutContent}
          >
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
          </Animated.View>
        </View>
      </GestureDetector>

      <Button title="Reset Zoom" onPress={handleResetZoom} />
    </View>
  )
}
```

### Monitoring Zoom State

You can use the `isZoomedIn` shared value to react to zoom state changes:

```jsx
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated'

function MyComponent() {
  const { isZoomedIn, zoomGesture, /* ... */ } = useZoomGesture()

  useAnimatedReaction(
    () => isZoomedIn.value,
    (zoomed) => {
      runOnJS(console.log)('Zoom state changed:', zoomed)
    }
  )

  // ... rest of component
}
```

### Custom Animation Functions

Use different animation functions for different effects:

```jsx
import { withSpring, withTiming } from 'react-native-reanimated'

// Bouncy spring animation
const { zoomGesture } = useZoomGesture({
  animationFunction: withSpring,
  animationConfig: {
    damping: 15,
    stiffness: 150,
  },
})

// Slower, smoother timing
const { zoomGesture } = useZoomGesture({
  animationFunction: withTiming,
  animationConfig: {
    duration: 500,
  },
})
```


## License

The library is released under the MIT licence. For more information see [`LICENSE`](/LICENSE).

## TODO

- make list component with https://github.com/callstack/react-native-pager-view and export it for galleries usecase
