const request = require('supertest');

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
};

// Mock the Supabase module before importing the app
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock dotenv to prevent loading actual environment variables
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import the app after mocking
const app = require('../server.js');

describe('POST /api/posts', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Successful requests', () => {
    test('should create a new post with valid data', async () => {
      // Arrange
      const newPost = {
        title: 'Test Post Title',
        content: 'This is test post content',
        user_id: 1
      };

      const createdPost = {
        id: 1,
        ...newPost,
        created_at: '2024-01-01T00:00:00.000Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdPost,
              error: null
            })
          })
        })
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: createdPost,
        message: 'Post created successfully'
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    });

    test('should handle posts with long content', async () => {
      // Arrange
      const longContent = 'A'.repeat(1000); // 1000 character content
      const newPost = {
        title: 'Long Content Post',
        content: longContent,
        user_id: 1
      };

      const createdPost = { id: 1, ...newPost };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: createdPost,
              error: null
            })
          })
        })
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(longContent);
    });
  });

  describe('Validation errors', () => {
    test('should return 400 when title is missing', async () => {
      // Arrange
      const invalidPost = {
        content: 'Content without title',
        user_id: 1
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields: title'
      });
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return 400 when content is missing', async () => {
      // Arrange
      const invalidPost = {
        title: 'Title without content',
        user_id: 1
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields: content'
      });
    });

    test('should return 400 when user_id is missing', async () => {
      // Arrange
      const invalidPost = {
        title: 'Test Title',
        content: 'Test Content'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields: user_id'
      });
    });

    test('should return 400 when multiple fields are missing', async () => {
      // Arrange
      const invalidPost = {
        user_id: 1
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields:');
      expect(response.body.error).toContain('title');
      expect(response.body.error).toContain('content');
    });

    test('should return 400 when request body is empty', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields:');
    });
  });

  describe('Database errors', () => {
    test('should handle database insertion errors', async () => {
      // Arrange
      const validPost = {
        title: 'Test Title',
        content: 'Test Content',
        user_id: 1
      };

      const mockError = new Error('Database insertion failed');
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(validPost)
        .expect(500);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: 'Database insertion failed'
      });
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should handle foreign key constraint errors', async () => {
      // Arrange
      const postWithInvalidUser = {
        title: 'Test Title',
        content: 'Test Content',
        user_id: 999 // Non-existent user
      };

      const mockError = new Error('Foreign key constraint violation');
      mockError.status = 409;
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(postWithInvalidUser)
        .expect(409);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        error: 'Foreign key constraint violation'
      });
    });
  });

  describe('Request format validation', () => {
    test('should accept valid JSON content type', async () => {
      // Arrange
      const validPost = {
        title: 'Test Title',
        content: 'Test Content',
        user_id: 1
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, ...validPost },
              error: null
            })
          })
        })
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/json')
        .send(validPost)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });

    test('should verify correct data is passed to Supabase', async () => {
      // Arrange
      const validPost = {
        title: 'Test Title',
        content: 'Test Content',
        user_id: 1
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 1, ...validPost },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      });

      // Act
      await request(app)
        .post('/api/posts')
        .send(validPost);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith([validPost]);
    });
  });
});