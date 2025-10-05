// Global test setup configuration

// Set test environment variable
process.env.NODE_ENV = "test";

// Increase timeout for all tests
jest.setTimeout(30000);

// Suppress console output during tests (optional)
// Uncomment these lines if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
