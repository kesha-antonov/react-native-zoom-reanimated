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
    // The library source lives outside <rootDir>, so it would otherwise resolve these from
    // the workspace root instead of the example. Pin them to one copy each so the
    // `jest.mock(...)` calls in jest.setup.js apply to the library too.
    '^react-native-gesture-handler$': '<rootDir>/node_modules/react-native-gesture-handler',
    '^react-native-reanimated$': '<rootDir>/node_modules/react-native-reanimated',
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native$': '<rootDir>/node_modules/react-native',
  },
  testTimeout: 30000,
}
