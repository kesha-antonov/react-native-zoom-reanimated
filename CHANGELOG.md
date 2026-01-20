# Changelog

## v1.5.0

### ✨ New Features
- **Apple Photos-style gallery navigation** — Seamless swipe between images while zoomed in, just like Apple Photos
- **`enableSwipeToClose`** — Enable horizontal swipe to pass through to parent FlatList/ScrollView at edge
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
