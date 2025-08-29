# react-native-zoom-reanimated Development Guide

React Native library providing a zoomable view component built with react-native-reanimated and react-native-gesture-handler. The library includes a main source component and a complete React Native example application.

**Always reference these instructions first and only fall back to search or bash commands when you encounter unexpected information that differs from the info documented here.**

## Working Effectively

### Bootstrap and Environment Setup
- **Node.js requirement**: Project uses Node.js v20+. No additional Node.js installation needed.
- **Dependencies installation**: 
  - Root library: `npm install` -- takes 45-60 seconds. NEVER CANCEL.
  - Example app: `cd example && npm install` -- takes 40-50 seconds. NEVER CANCEL.
- **Initial setup for development**:
  ```bash
  # Install root dependencies
  npm install
  
  # Install example dependencies  
  cd example && npm install
  ```

### Development and Build Commands

**Library Development:**
- **TypeScript compilation**: `npx tsc --noEmit` -- takes 1-2 seconds. Validates library source code.
- **Library linting**: `npx eslint -c .eslintrc.js --ext .ts,.tsx src/` -- takes 1-2 seconds.
- **Library autofix**: `npx eslint -c .eslintrc.js --ext .ts,.tsx --fix src/` -- automatically fixes linting issues in src/

**Example App Development:**
- **Start Metro bundler**: `cd example && npm start` -- takes 15-20 seconds to start. NEVER CANCEL.
  - Shows Metro ASCII art logo when ready
  - Interactive menu: 'i' for iOS, 'a' for Android, 'd' for dev menu, 'r' for reload
  - Use Ctrl+C to stop
- **TypeScript validation**: `cd example && npx tsc --noEmit` -- takes 2-3 seconds. 
- **Linting**: `cd example && npm run lint` -- takes 1-2 seconds.
- **Lint autofix**: `cd example && npx eslint . --fix` -- takes 1-2 seconds.

### Build Validation and Testing

**Bundle Creation (works without devices):**
- **Android bundle**: `cd example && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output bundle.js --assets-dest /tmp/` -- takes 20-25 seconds. NEVER CANCEL.
- **iOS bundle**: `cd example && npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output bundle-ios.js --assets-dest /tmp/` -- takes 20-25 seconds. NEVER CANCEL.

**Testing Limitations:**
- **Jest tests**: Root Jest tests fail due to configuration issues with TSX/JSX parsing. This is a known limitation.
- **Example tests**: `cd example && npm run test` fails because React Native native modules are not available in Jest (expected behavior for RN libraries).
- **Device testing**: Cannot run on physical devices or emulators in this environment. Use bundle creation to validate builds.

## Validation Requirements

**ALWAYS run these validation steps after making changes:**

1. **TypeScript validation**: 
   ```bash
   # Library code
   npx tsc --noEmit
   
   # Example app code
   cd example && npx tsc --noEmit
   ```

2. **Linting validation and fixes**:
   ```bash
   # Fix library linting issues (note: autofix only handles style issues, not TypeScript errors)
   npx eslint -c .eslintrc.js --ext .ts,.tsx --fix src/
   
   # Fix example linting issues
   cd example && npx eslint . --fix
   
   # Verify linting status (may show remaining issues that need manual fixes)
   npx eslint -c .eslintrc.js --ext .ts,.tsx src/
   cd example && npm run lint
   ```

3. **Bundle validation** (proves the app builds correctly):
   ```bash
   cd example
   # Test Android bundle
   npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output bundle.js --assets-dest /tmp/
   # Test iOS bundle  
   npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output bundle-ios.js --assets-dest /tmp/
   # Clean up
   rm bundle.js bundle-ios.js
   ```

4. **Metro bundler validation**:
   ```bash
   cd example
   # Start Metro (should show ASCII logo and "Dev server ready" message)
   npm start
   # Stop with Ctrl+C after confirming it starts successfully
   ```

## Manual Validation Scenarios

**After making changes to the library, always test these scenarios:**

1. **Component Integration Test**: 
   - Start Metro: `cd example && npm start`
   - Verify the example app has toggle functionality between single image and gallery modes
   - Confirm both modes use the Zoom component correctly
   - Check that TypeScript compilation passes for all component usage patterns

2. **API Compatibility Test**:
   - Review that `src/index.tsx` exports match the usage in `example/App.tsx` and `example/FlatListExample.tsx`  
   - Verify that prop interfaces and TypeScript types are consistent
   - Test that configuration props (doubleTapConfig, etc.) work as expected

3. **Build Integration Test**:
   - Create bundles for both platforms to ensure no runtime import errors
   - Validate that all required peer dependencies are properly referenced
   - Check that native module integration works (react-native-reanimated, react-native-gesture-handler)

## Common Development Tasks

### Working with the Library Source Code
- **Main component**: `src/index.tsx` - The main Zoom component implementation
- **Supporting files**: `src/constants.ts`, `src/styles.ts`, `src/utils.ts`
- **Common linting issues**: Line length (max 120 chars), TypeScript `any` types, React hooks dependencies
- **Fix pattern**: Run `npm run autofix`, then manually fix remaining TypeScript issues

### Working with the Example Application
- **Main app**: `example/App.tsx` - Toggle between single image and gallery examples
- **Gallery example**: `example/FlatListExample.tsx` - Full-featured image gallery with FlatList
- **Standalone example**: `example/ImageGalleryStandalone.tsx` - Simple copy-paste ready gallery
- **Configuration files**: `babel.config.js`, `metro.config.js`, `tsconfig.json`

### Development Environment Capabilities and Limitations

**What Works:**
- ✅ Full TypeScript compilation and validation
- ✅ ESLint linting and automatic fixes
- ✅ Metro bundler startup and JavaScript bundling
- ✅ React Native bundle creation for both iOS and Android
- ✅ Source code editing and validation
- ✅ npm/yarn package management

**What Doesn't Work:**
- ❌ Running on physical devices or emulators (no device access)
- ❌ Jest testing (configuration issues with React Native environment)
- ❌ iOS builds requiring Xcode (macOS-only)
- ❌ Android Studio builds (missing Android Studio, but Gradle/SDK available)
- ❌ React Native CLI commands that require devices (`npm run ios`, `npm run android`)

## Timing Expectations and Timeouts

**CRITICAL - Never cancel these operations:**

| Command | Expected Time | Timeout Setting | Notes |
|---------|--------------|----------------|-------|
| `npm install` | 45-60 seconds | 300 seconds minimum | Root and example directories |
| `npm start` (Metro) | 15-20 seconds | 60 seconds minimum | Shows ASCII logo when ready |
| Bundle creation | 4-25 seconds | 300 seconds minimum | Faster with warm Metro cache |
| TypeScript compilation | 1-3 seconds | 30 seconds | Fast validation |
| Linting | 1-2 seconds | 30 seconds | Quick feedback |

**Build may take longer on slower systems - always wait for completion.**

## Repository Structure Reference

```
.
├── src/                     # Library source code
│   ├── index.tsx           # Main Zoom component
│   ├── constants.ts        # Configuration constants
│   ├── styles.ts          # Styling utilities  
│   └── utils.ts           # Helper functions
├── example/                # React Native example app
│   ├── App.tsx            # Main example app with toggle
│   ├── FlatListExample.tsx # Gallery implementation
│   ├── ImageGalleryStandalone.tsx # Simple gallery
│   ├── android/           # Android project files
│   ├── ios/              # iOS project files  
│   └── package.json      # Example app dependencies
├── package.json          # Library package configuration
├── tsconfig.json         # TypeScript configuration
└── .eslintrc.js         # ESLint configuration
```

## Troubleshooting

**TypeScript compilation errors:**
- Check `tsconfig.json` for syntax errors (missing commas, brackets)
- Ensure module resolution settings are consistent
- Fix type annotations for function parameters

**Linting failures:**
- Use `npm run autofix` or `npx eslint . --fix` to auto-fix most issues
- Common issues: line length, semicolons, spacing, TypeScript any types
- Check for React hooks dependency warnings

**Metro bundler won't start:**
- Clear Metro cache: `cd example && npx react-native start --reset-cache`
- Check for port conflicts (default 8081)
- Verify all dependencies installed with `npm install`

**Bundle creation fails:**
- Ensure Metro bundler dependencies are installed in example/
- Check for TypeScript compilation errors first
- Verify entry file exists: `example/index.js`

## Example Commands Reference

**Complete development workflow:**
```bash
# Setup (run once)
npm install                    # 45-60 seconds
cd example && npm install      # 40-50 seconds

# Validate library (always run after library changes)
npx tsc --noEmit                                              # 1-2 seconds  
npx eslint -c .eslintrc.js --ext .ts,.tsx --fix src/        # 2-3 seconds
npx eslint -c .eslintrc.js --ext .ts,.tsx src/              # Shows remaining issues

# Validate example app (always run after example changes)
cd example
npx tsc --noEmit               # 2-3 seconds
npx eslint . --fix             # 1-2 seconds  
npm run lint                   # 1-2 seconds

# Test builds (always run to verify integration)
npm start                      # 15-20 seconds, shows ASCII art, then Ctrl+C
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output bundle.js --assets-dest /tmp/  # 4-25 seconds
rm bundle.js
```

This workflow validates that changes work correctly and can be built successfully.