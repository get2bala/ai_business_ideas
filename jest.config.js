module.exports = {
  testEnvironment: 'jsdom',
  // Preload globals and DOM before modules are imported
  setupFiles: ['./jest.preload.js'],
  // Run additional setup after environment is ready
  setupFilesAfterEnv: ['./jest.setup.js'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
