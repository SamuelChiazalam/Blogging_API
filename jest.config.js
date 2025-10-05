// Jest testing framework configuration

module.exports = {
  // Test environment
  testEnvironment: "node",

  // Coverage directory
  coverageDirectory: "coverage",

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Detect open handles (helps find why Jest doesn't exit)
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Verbose output
  verbose: true,

  // Setup files to run before tests
  setupFilesAfterEnv: ["./tests/setup.js"],
};
