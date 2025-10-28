/**
 * Test helper utilities for API testing
 */

/**
 * Creates a mock post object with default values
 * @param {Object} overrides - Properties to override in the default post
 * @returns {Object} Mock post object
 */
const createMockPost = (overrides = {}) => {
  return {
    id: 1,
    title: 'Test Post Title',
    content: 'This is test post content',
    user_id: 1,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides
  };
};

/**
 * Creates multiple mock posts
 * @param {number} count - Number of posts to create
 * @param {Object} baseOverrides - Base properties to apply to all posts
 * @returns {Array} Array of mock post objects
 */
const createMockPosts = (count = 3, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockPost({
      id: index + 1,
      title: `Test Post ${index + 1}`,
      content: `Content for post ${index + 1}`,
      ...baseOverrides
    })
  );
};

/**
 * Creates a mock user object
 * @param {Object} overrides - Properties to override in the default user
 * @returns {Object} Mock user object
 */
const createMockUser = (overrides = {}) => {
  return {
    id: 1,
    name: 'Test User',
    ...overrides
  };
};

/**
 * Validates the structure of an API response
 * @param {Object} response - The response object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {boolean} True if response has all required fields
 */
const validateResponseStructure = (response, requiredFields = ['success', 'timestamp']) => {
  return requiredFields.every(field => response.hasOwnProperty(field));
};

/**
 * Creates a mock Supabase error
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Error} Mock error object
 */
const createMockSupabaseError = (message = 'Database error', status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Mock Supabase client factory
 * @param {Object} mockResponses - Object containing mock responses for different operations
 * @returns {Object} Mock Supabase client
 */
const createMockSupabaseClient = (mockResponses = {}) => {
  return {
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        order: jest.fn(() => mockResponses.select || { data: [], error: null }),
        eq: jest.fn(() => ({
          single: jest.fn(() => mockResponses.selectSingle || { data: null, error: null })
        })),
        single: jest.fn(() => mockResponses.selectSingle || { data: null, error: null })
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => mockResponses.insert || { data: null, error: null })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => mockResponses.update || { data: null, error: null })
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => mockResponses.delete || { error: null })
      }))
    }))
  };
};

module.exports = {
  createMockPost,
  createMockPosts,
  createMockUser,
  validateResponseStructure,
  createMockSupabaseError,
  createMockSupabaseClient
};