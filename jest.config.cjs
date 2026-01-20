// This project runs tests from the example directory
// Use `yarn test` or `cd example && jest` to run tests
module.exports = {
  rootDir: './example',
  ...require('./example/jest.config.cjs'),
}
