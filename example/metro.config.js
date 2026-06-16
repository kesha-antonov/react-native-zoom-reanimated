const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { getConfig } = require('react-native-builder-bob/metro-config')
const pkg = require('../package.json')

const root = path.resolve(__dirname, '..')

// react-native-builder-bob's metro helper wires up watching + resolving the
// library workspace from its source (so edits to ../src hot-reload here), while
// de-duplicating shared deps (react / react-native / reanimated / gesture-handler)
// against this example's copies.
module.exports = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
})
