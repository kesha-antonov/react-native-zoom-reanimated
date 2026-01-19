const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

// Get the root directory of the library
const libraryRoot = path.resolve(__dirname, '..')

const config = getDefaultConfig(__dirname)

// Watch both the example and the library source
config.watchFolders = [libraryRoot]

// Make sure Metro can resolve modules from both the example and the library
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(libraryRoot, 'node_modules'),
]

// Extra node_modules to look for
config.resolver.extraNodeModules = {
  'react-native-zoom-reanimated': libraryRoot,
}

// Exclude react-native and related modules from the library root to avoid duplicate module issues
const escapedLibraryRoot = libraryRoot.replace(/[/\\]/g, '[/\\\\]')
config.resolver.blockList = [
  ...(config.resolver.blockList || []),
  new RegExp(`${escapedLibraryRoot}/node_modules/react-native/.*`),
  new RegExp(`${escapedLibraryRoot}/node_modules/react-native-gesture-handler/.*`),
  new RegExp(`${escapedLibraryRoot}/node_modules/react-native-reanimated/.*`),
  new RegExp(`${escapedLibraryRoot}/node_modules/react/.*`),
]

module.exports = config
