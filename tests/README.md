# API Tests

This directory contains Jest test suites for the Posts API server.

## Setup

1. Install test dependencies:
```bash
npm install
```

2. Run tests:
```bash
npm test
```

3. Run tests in watch mode:
```bash
npm run test:watch
```

4. Run tests with coverage:
```bash
npm run test:coverage
```

5. Run test runner script:
```bash
npm run test:run
```

## Test Structure

### Test Files

- `posts.get.test.js` - Tests for GET /api/posts endpoint
- `posts.post.test.js` - Tests for POST /api/posts endpoint
- `setup.js` - Jest configuration and global test setup
- `helpers/testHelpers.js` - Utility functions for testing

### Test Categories

Each test file is organized into describe blocks:

1. **Successful requests** - Tests for valid scenarios
2. **Validation errors** - Tests for input validation
3. **Database errors** - Tests for database error handling
4. **Response format validation** - Tests for response structure

## Mocking Strategy

- **Supabase Client**: Mocked using Jest to avoid database dependencies
- **Environment Variables**: Set in setup.js for consistent test environment
- **Console Methods**: Mocked to reduce noise during testing

## Test Coverage

The tests cover:
- ✅ Successful API responses
- ✅ Input validation
- ✅ Error handling
- ✅ Response format validation
- ✅ Database interaction mocking

## Adding New Tests

1. Create a new test file following the naming pattern: `[endpoint].[method].test.js`
2. Import required dependencies and mock Supabase
3. Use the helper functions from `testHelpers.js` for common operations
4. Follow the existing describe block structure

## Example Test Structure

```javascript
describe('GET /api/endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    test('should return expected data', async () => {
      // Arrange, Act, Assert
    });
  });

  describe('Error handling', () => {
    test('should handle errors gracefully', async () => {
      // Arrange, Act, Assert
    });
  });
});
```