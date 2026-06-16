# Changelog

## v1.5.4

### ✨ New Features
- **react-native-gesture-handler v3 support** — The library now works with both Gesture Handler v2 and v3 (peer `>= 2.0.0`)
- **react-native-reanimated v4 support** — Compatible with both Reanimated v3 and v4 (peer `>= 3.0.0`)
- **Ships compiled code + type declarations** — The package now publishes transpiled CommonJS + ESM builds and `.d.ts` files (built with `react-native-builder-bob`) with proper `main` / `module` / `types` / `exports`, instead of raw TypeScript source

### 🔧 Improvements
- Dropped a private gesture-handler internal import so types stay stable across major versions
- Bumped toolchain dependencies (TypeScript 6, ESLint, etc.)

### 📦 Other Changes
- Example app upgraded to Expo SDK 56 / React Native 0.85 and restructured as a yarn workspace

## v1.5.2

### ✨ New Features
- **`onZoomChange` callback** — Real-time scale updates during zoom gesture (e.g., for showing zoom percentage)
- **`onZoomStateChange` callback** — Get notified when zoom state changes (zoomed in/out)
- **`scale` SharedValue** — Exposed from `useZoomGesture` hook for efficient worklet-based tracking
- **`isZoomedIn` SharedValue** — Track zoom state without JS bridge overhead

### 🔧 Improvements
- **Performance optimization** — Callbacks in `Zoom` component use `useAnimatedReaction` for efficient bridge communication
- **Cleaner hook API** — `useZoomGesture` now returns SharedValues instead of accepting callbacks, enabling 120fps animations without JS bridge

### 📦 Other Changes
- Updated README with comparison table (Zoom component vs useZoomGesture hook)
- Basic example now demonstrates both `onZoomChange` and `onZoomStateChange` usage

## v1.5.1

### ✨ New Features
- **Apple Photos-style gallery navigation** — Seamless swipe between images while zoomed in, just like Apple Photos
- **`enableGallerySwipe`** — Enable seamless swipe navigation to adjacent images when at edge
- **`parentScrollRef`** — Connect to parent FlatList for seamless edge-to-scroll transition
- **`currentIndex` / `itemWidth`** — Support for calculating scroll offset in galleries
- **`minScale` / `maxScale`** props — Configure zoom limits (fixes #29 & #34)
- **Gap support** — Add gaps between images in gallery mode
- **Focal point zoom** — Double-tap now zooms centered on tap location
- **`useZoomGesture` hook** — Exposed for advanced customization with full documentation

### 🔧 Improvements
- **Rewritten animation system** — Completely rebuilt for smoother 120fps animations
- **Dynamic focal point tracking** — Apple Photos-style pinch behavior with finger tracking
- **Rubber band effect** — Natural over-scroll/over-zoom feeling at boundaries
- **Better edge detection** — Improved boundary handling with spring animations

### 🐛 Bug Fixes
- Fix #51 — Improved boundary spring animation
- Fix #50 — Gesture handling improvements
- Fix #31 — Gallery behavior fixes
- Fix #13 — Various gesture issues

### 📦 Other Changes
- Migrated example app to Expo
- Migrated ESLint to v9 flat config
- Added pre-commit hooks
- Updated peer dependencies
- Comprehensive README rewrite with examples
