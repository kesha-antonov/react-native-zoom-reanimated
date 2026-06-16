/* global module */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo.*)/)',
  ],
  modulePaths: ['<rootDir>/node_modules'],
  // The library is consumed via `link:..`, which the package manager does not
  // materialize into node_modules (the link target is an ancestor dir). Resolve
  // it straight to source, mirroring Metro's resolver.extraNodeModules mapping.
  moduleNameMapper: {
    '^react-native-zoom-reanimated$': '<rootDir>/../src/index.tsx',
  },
  testTimeout: 30000,
}
