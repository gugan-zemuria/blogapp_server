#!/usr/bin/env node

/**
 * Test runner script to verify all tests pass
 * This script can be used in CI/CD pipelines
 */

import { execSync } from 'child_process';

console.log('🧪 Running Jest test suites...\n');

try {
  // Run tests with coverage
  const output = execSync('npm test', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ All tests passed successfully!');
  console.log('\n📊 To see test coverage, run: npm run test:coverage');
  
} catch (error) {
  console.error('\n❌ Tests failed!');
  console.error('Error:', error.message);
  process.exit(1);
}