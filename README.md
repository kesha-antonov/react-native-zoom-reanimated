<p align="center">
  <a href="https://badge.fury.io/js/react-native-zoom-reanimated"><img src="https://badge.fury.io/js/react-native-zoom-reanimated.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-zoom-reanimated"><img src="https://img.shields.io/npm/dm/react-native-zoom-reanimated.svg" alt="npm downloads" /></a>
  <a href="https://npm-stat.com/charts.html?package=react-native-zoom-reanimated&from=2015-01-01"><img src="https://img.shields.io/badge/total%20downloads-1.16M-blue.svg" alt="total npm downloads" /></a>
  <a href="https://www.npmjs.com/package/react-native-zoom-reanimated"><img src="https://img.shields.io/npm/dt/react-native-zoom-reanimated.svg?label=18-months%20downloads" alt="npm downloads (last 18 months)" /></a>
  <a href="https://github.com/kesha-antonov/react-native-zoom-reanimated/blob/main/LICENSE"><img src="https://img.shields.io/github/license/kesha-antonov/react-native-zoom-reanimated.svg" alt="license" /></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg" alt="platforms" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue.svg" alt="TypeScript" /></a>
</p>

<h1 align="center">React Native Zoom Reanimated</h1>

<p align="center">
  Apple Photos-style zoom component for React Native with pinch, pan, and double-tap gestures. Built with React Native Reanimated and Gesture Handler for buttery smooth 120fps animations.
</p>

<p align="center">
  <sub>Using it in production? A ⭐ helps other developers find the library.</sub>
</p>

<hr />

<table align="center">
<tr>
<td align="center" valign="top" width="190">
  <a href="https://cryptoc-app.web.app/"><img src="https://cryptoc-app.web.app/img/icon.png?v=3" width="76" height="76" alt="cryptoc app icon" /></a>
  <br /><br />
  <img src="https://cryptoc-app.web.app/img/qr-get.png?v=2" width="124" height="124" alt="QR code that installs cryptoc" />
  <br />
  <sub>Scan to install</sub>
  <br /><br />
  <a href="https://apps.apple.com/app/cryptoc/id1333169178"><img height="40" src="https://cryptoc-app.web.app/img/appstore.svg?v=2" alt="Download on the App Store" /></a>
  <br />
  <a href="https://play.google.com/store/apps/details?id=co.ssoul.CryptoC"><img height="59" src="https://cryptoc-app.web.app/img/googleplay.png?v=2" alt="Get it on Google Play" /></a>
</td>
<td valign="top">

### Support my work

**[cryptoc](https://cryptoc-app.web.app/)** - my crypto portfolio app. Your coins on the home screen, lock screen and watch face. iPhone, iPad, Mac, Apple Watch, Android, Android tablet and Wear OS.

- Portfolio with average buy price and 24h / 180-day / all-time P&L
- Widgets in three sizes, refreshed in the background - most days you never open the app
- Price alerts on 5,000+ coins, delivered while the app is closed
- **No account, no email, no exchange API keys, no ads.** Your holdings never reach a server - they sync through your own iCloud or Google Drive
- Free for 3 holdings, and that is not a trial timer

<sub>Downloading it is what pays for the time that goes into these libraries.</sub>

</td>
</tr>
</table>

<hr />

## ✨ Features

- 🔍 **Pinch to Zoom** — Smooth pinch gesture with rubber band effect
- 👆 **Double Tap** — Tap twice to zoom in/out with configurable scale
- 🖐️ **Pan Gesture** — Drag zoomed content with momentum and boundary bounce
- 📱 **Apple Photos Gallery** — Seamless swipe between zoomed images in FlatList
- 🔄 **Rubber Band Effect** — Natural over-scroll/over-zoom feeling
- 🎯 **Focal Point Zoom** — Zoom centers on pinch/tap location
- ⚡ **120fps** — Silky smooth animations on ProMotion displays
- 📝 **TypeScript** — Complete type definitions included

## 📸 Preview

<table>
  <tr>
    <td align="center"><b>iOS</b></td>
    <td align="center"><b>Android</b></td>
  </tr>
  <tr>
    <td>

https://github.com/user-attachments/assets/9da40463-7b70-46bb-bfe3-eb0ab4f8feb7

</td>
    <td>

https://github.com/kesha-antonov/react-native-zoom-reanimated/assets/11584712/7e8a572b-8130-4aea-88c7-2ca035a155a1

</td>
  </tr>
</table>

## 📖 Table of Contents

- [✨ Features](#-features)
- [📸 Preview](#-preview)
- [📖 Table of Contents](#-table-of-contents)
- [📋 Requirements](#-requirements)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [💡 Examples](#-examples)
  - [Basic Usage](#basic-usage)
  - [Image Gallery with FlatList](#image-gallery-with-flatlist)
  - [Apple Photos-Style Gallery](#apple-photos-style-gallery)
  - [Using the Hook Directly](#using-the-hook-directly)
- [📖 API Reference](#-api-reference)
  - [Zoom Component Props](#zoom-component-props)
  - [DoubleTapConfig](#doubletapconfig)
  - [ScrollableRef](#scrollableref)
- [🔧 Advanced Usage: useZoomGesture Hook](#-advanced-usage-usezoomgesture-hook)
  - [Zoom Component vs useZoomGesture Hook](#zoom-component-vs-usezoomgesture-hook)
  - [Hook API](#hook-api)
  - [Basic Hook Usage](#basic-hook-usage)
- [🎛 Gesture Handler v2 / v3 API](#-gesture-handler-v2--v3-api)
  - [Choosing per component](#choosing-per-component)
  - [Choosing app-wide](#choosing-app-wide)
  - [Choosing in the hook API](#choosing-in-the-hook-api)
  - [Capability check](#capability-check)
- [📦 Example App](#-example-app)
- [📱 Platform Support](#-platform-support)
- [🤝 Contributing](#-contributing)
- [👥 Author](#-author)
- [📄 License](#-license)

## 📋 Requirements

| Dependency | Version |
|:----------:|:-------:|
| react-native-reanimated | >= 2.0.0 |
| react-native-gesture-handler | >= 2.0.0 |

## 📦 Installation

Install the library using either Yarn:

```bash
yarn add react-native-zoom-reanimated
```

or npm:

```bash
npm install --save react-native-zoom-reanimated
```

Make sure you have [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/) and [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation) installed and configured.

## 🚀 Usage

```javascript
import Zoom from 'react-native-zoom-reanimated'

// For Apple Photos-style gallery, also import ScrollableRef type
import Zoom, { ScrollableRef } from 'react-native-zoom-reanimated'
```

## 💡 Examples

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
  enableGallerySwipe
  parentScrollRef={flatListRef}
  currentIndex={index}
  itemWidth={deviceWidth + IMAGE_GAP}
>
  <Image source={{ uri: imageUri }} />
</Zoom>
```

Features:
- ✅ Swipe between images even while zoomed in
- ✅ Smooth edge-to-scroll transition
- ✅ Auto zoom reset when changing images
- ✅ Gap between images

> 📄 Full example: [`example/FlatListExample.tsx`](./example/FlatListExample.tsx) — complete implementation with all features

### Using the Hook Directly

For advanced control, use `useZoomGesture` hook:

```jsx
import { useZoomGesture } from 'react-native-zoom-reanimated'
import { useAnimatedReaction } from 'react-native-reanimated'

const { zoomGesture, contentContainerAnimatedStyle, onLayout, onLayoutContent, zoomOut, isZoomedIn, scale } = useZoomGesture({
  minScale: 1,
  maxScale: 5,
})

// React to scale changes efficiently in worklet (no JS bridge overhead)
useAnimatedReaction(
  () => scale.value,
  (currentScale) => {
    console.log('Current scale:', currentScale)
  }
)

// React to zoom state changes
useAnimatedReaction(
  () => isZoomedIn.value,
  (isZoomed) => {
    console.log('Is zoomed:', isZoomed)
  }
)
```

> 📄 Full example: [`example/UseZoomGestureExample.tsx`](./example/UseZoomGestureExample.tsx)

## 📖 API Reference

### Zoom Component Props

| Name                  | Type                   | Required | Description                                                                                                                                                                                                              |
|-----------------------|------------------------|----------|------------------|
| style                 | `StyleProp<ViewStyle>` | No       | Container style |
| contentContainerStyle | `StyleProp<ViewStyle>` | No       | Content container style |
| minScale              | `number`               | No       | Minimum allowed zoom scale. Default is `1`. Set to `1` to prevent zooming out smaller than initial size. Set to a value < 1 (e.g., `0.5`) to allow zooming out to 50% |
| maxScale              | `number`               | No       | Maximum allowed zoom scale. Default is `4` |
| onZoomStateChange     | `(isZoomed: boolean) => void` | No | Callback fired when zoom state changes. Called with `true` when zoomed in, `false` when zoomed out to initial scale |
| onZoomChange          | `(scale: number) => void` | No | Callback fired during zoom gesture with current scale value. Called continuously while pinching, useful for UI updates (e.g., showing zoom percentage). For performance-critical use cases, use `useZoomGesture` hook with `scale` SharedValue instead |
| enableGallerySwipe    | `boolean`              | No       | Enable Apple Photos-style seamless gallery navigation. When zoomed and panning hits horizontal boundary, continued swipe allows scrolling to adjacent images. Default is `false` |
| parentScrollRef       | `RefObject<ScrollableRef>` | No   | Reference to parent FlatList/ScrollView for seamless edge scrolling. When provided with `enableGallerySwipe`, enables Apple Photos-style continuous swipe: zoomed image pans to edge, then seamlessly scrolls parent list. Compatible with FlatList/ScrollView from `react-native`, `react-native-gesture-handler`, and `react-native-reanimated` |
| currentIndex          | `number`               | No       | Current index in the parent list (for calculating scroll offset). Required when using `parentScrollRef` |
| itemWidth             | `number`               | No       | Width of each item in the parent list (for calculating scroll offset). Required when using `parentScrollRef`. Usually equals `deviceWidth + imageGap` |
| animationFunction     | function               | No       | Animation function from `react-native-reanimated`. Default: `withTiming`. For example, you can use `withSpring` instead: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring |
| animationConfig       | object                 | No       | Config for animation function from `react-native-reanimated`. For example, avaiable options for `withSpring` animation: https://docs.swmansion.com/react-native-reanimated/docs/api/animations/withSpring#options-object |
| doubleTapConfig       | `DoubleTapConfig`      | No       | Config for zoom on double tap. See below for details |
| gestureApi            | `'v2' \| 'v3' \| 'auto'` | No    | Which `react-native-gesture-handler` API to build the gesture with. Default is `'auto'`, or whatever was passed to `setGestureApiVersion()`. See [Gesture Handler v2 / v3 API](#-gesture-handler-v2--v3-api) |

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

## 🔧 Advanced Usage: useZoomGesture Hook

For advanced use cases, use the `useZoomGesture` hook directly for full control.

> 📄 See [`example/UseZoomGestureExample.tsx`](./example/UseZoomGestureExample.tsx) for a complete example.

### Zoom Component vs useZoomGesture Hook

| Approach | Simplicity | Performance | When to use |
|----------|------------|-------------|-------------|
| `Zoom` + `onZoomStateChange`/`onZoomChange` | ✅ Simple | ⚠️ Via JS bridge | Most use cases |
| `useZoomGesture` + `useAnimatedReaction` | ⚠️ More complex | ✅ 120fps, no bridge | Performance-critical apps |

**Zoom component** uses callbacks (`onZoomChange`, `onZoomStateChange`) that communicate via the JS bridge. This is simple to use but may have slight delays on rapid updates.

**useZoomGesture hook** returns `SharedValue` objects (`scale`, `isZoomedIn`) that update directly in the UI thread. Use `useAnimatedReaction` to respond to changes without JS bridge overhead — ideal for 120fps animations.

### Hook API

```typescript
interface UseZoomGestureProps {
  animationFunction?: typeof withTiming  // Animation function (default: withTiming)
  animationConfig?: object               // Configuration for animation function
  minScale?: number                      // Minimum allowed zoom scale (default: 1)
  maxScale?: number                      // Maximum allowed zoom scale (default: 4)
  enableGallerySwipe?: boolean           // Enable Apple Photos-style gallery swipe (default: false)
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
  scale: SharedValue<number>                // Current zoom scale (use with useAnimatedReaction)
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

## 🎛 Gesture Handler v2 / v3 API

`react-native-gesture-handler` 3.x ships a new hooks-based gestures API (`usePanGesture`,
`usePinchGesture`, ...) next to the 2.x builder API (`Gesture.Pan()`, `Gesture.Pinch()`).
This library builds its zoom gesture with either one.

**You do not have to configure anything.** By default the API is detected from the
`react-native-gesture-handler` version installed in your app:

| Installed gesture handler | API used |
|---------------------------|----------|
| 3.x                       | v3 hooks API |
| 2.x                       | v2 builder API |

Detection happens at both levels: `useZoomGesture` and `<Zoom />` pick the right one at runtime,
and the type of `zoomGesture` resolves to the matching gesture type at compile time, so it is
always accepted by the `GestureDetector` of your installed version.

Override it only if you need to - for example to stay on the v2 API after upgrading to
`react-native-gesture-handler` 3.x.

### Choosing per component

```jsx
import Zoom from 'react-native-zoom-reanimated'

<Zoom gestureApi="v2">
  <Image source={{ uri: 'https://example.com/image.jpg' }} />
</Zoom>
```

`gestureApi` accepts `'auto'` (default), `'v2'` or `'v3'`. Changing it on a mounted `Zoom`
remounts its gesture tree.

### Choosing app-wide

Call `setGestureApiVersion` once at startup, before rendering any `Zoom`. It sets the default
used by `useZoomGesture` and by every `Zoom` that does not pass `gestureApi` itself.

```javascript
import { setGestureApiVersion } from 'react-native-zoom-reanimated'

setGestureApiVersion('v2') // or 'v3', or 'auto' (the default)
```

A component keeps the version it resolved on its first render, so calling this later only
affects new mounts.

### Choosing in the hook API

`useZoomGesture` follows the same auto-detection. To pin a version at a single call site,
import the version-specific hook instead:

```jsx
import { useZoomGestureV2, useZoomGestureV3 } from 'react-native-zoom-reanimated'

// react-native-gesture-handler v2 builder API - works on 2.x and 3.x
const zoom = useZoomGestureV2({ maxScale: 6 })

// react-native-gesture-handler v3 hooks API - requires 3.x, throws otherwise
const zoom = useZoomGestureV3({ maxScale: 6 })
```

All three return the same shape; only the type of `zoomGesture` differs.

### Capability check

```javascript
import { isGestureApiV3Supported } from 'react-native-zoom-reanimated'

if (isGestureApiV3Supported()) {
  // react-native-gesture-handler >= 3 is installed
}
```

## 📦 Example App

```bash
cd example
yarn install
yarn start:ios     # or yarn start:android
```

The example app demonstrates:
- Basic zoom functionality
- Image gallery with FlatList
- Apple Photos-style seamless navigation
- Using the hook directly

## 📱 Platform Support

| Platform | Status |
|----------|--------|
| **iOS** | ✅ Full support |
| **Android** | ✅ Full support |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation (`yarn tsc --noEmit && yarn eslint src/`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 👥 Author

Maintained by [Kesha Antonov](https://github.com/kesha-antonov)

I also build **[cryptoc](https://cryptoc-app.web.app/)** - a crypto portfolio app with home screen, lock screen and Watch widgets, no account and no exchange API keys.

> Please note that this project is maintained in free time. If you find it helpful, please consider [becoming a sponsor](https://github.com/sponsors/kesha-antonov).

## 📄 License

[MIT](./LICENSE)
