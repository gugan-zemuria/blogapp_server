// Jest setup file for API tests
// This file runs before each test suite

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3002'; // Use different port for testing
process.env.SUPABASE_API_URL = 'https://test.supabase.co';
process.env.SUPABASE_API_KEY = 'test-key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise during testing
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Clean up after all tests
afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});