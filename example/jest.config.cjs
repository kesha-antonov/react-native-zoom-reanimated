/* global module */
module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo.*)/)',
  ],
  modulePaths: ['<rootDir>/node_modules'],
  testTimeout: 30000,
}
