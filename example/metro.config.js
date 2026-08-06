const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withMetroConfig } = require('react-native-monorepo-config')

// Watches + resolves the library workspace from its source (so edits to ../src
// hot-reload here) via the `source` export condition in the library's
// package.json, while de-duplicating shared deps (react / react-native /
// reanimated / gesture-handler) against this example's copies.
// Formerly `react-native-builder-bob/metro-config`, extracted into its own
// package in builder-bob 0.43.
module.exports = withMetroConfig(getDefaultConfig(__dirname), {
  root: path.resolve(__dirname, '..'),
  dirname: __dirname,
})
