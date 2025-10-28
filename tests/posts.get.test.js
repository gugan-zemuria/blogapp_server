const request = require('supertest');

// Mock Supabase client
const mockSupabase = {
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            order: jest.fn(() => ({
                // This will be configured in individual tests
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

describe('GET /api/posts', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('Successful requests', () => {
        test('should return all posts with success response', async () => {
            // Arrange
            const mockPosts = [
                { id: 1, title: 'Test Post 1', content: 'Content 1', user_id: 1 },
                { id: 2, title: 'Test Post 2', content: 'Content 2', user_id: 2 }
            ];

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: mockPosts,
                        error: null
                    })
                })
            });

            // Act
            const response = await request(app)
                .get('/api/posts')
                .expect(200);

            // Assert
            expect(response.body).toMatchObject({
                success: true,
                data: mockPosts,
                count: 2
            });
            expect(response.body).toHaveProperty('timestamp');
            expect(mockSupabase.from).toHaveBeenCalledWith('posts');
        });

        test('should return empty array when no posts exist', async () => {
            // Arrange
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                })
            });

            // Act
            const response = await request(app)
                .get('/api/posts')
                .expect(200);

            // Assert
            expect(response.body).toMatchObject({
                success: true,
                data: [],
                count: 0
            });
        });
    });

    describe('Error handling', () => {
        test('should handle database errors gracefully', async () => {
            // Arrange
            const mockError = new Error('Database connection failed');
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: null,
                        error: mockError
                    })
                })
            });

            // Act
            const response = await request(app)
                .get('/api/posts')
                .expect(500);

            // Assert
            expect(response.body).toMatchObject({
                success: false,
                error: 'Database connection failed'
            });
            expect(response.body).toHaveProperty('timestamp');
        });

        test('should handle unexpected server errors', async () => {
            // Arrange
            mockSupabase.from.mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            // Act
            const response = await request(app)
                .get('/api/posts')
                .expect(500);

            // Assert
            expect(response.body).toMatchObject({
                success: false,
                error: 'Unexpected error'
            });
        });
    });

    describe('Response format validation', () => {
        test('should return posts ordered by id descending', async () => {
            // Arrange
            const mockPosts = [
                { id: 3, title: 'Newest Post', content: 'Content 3', user_id: 1 },
                { id: 2, title: 'Middle Post', content: 'Content 2', user_id: 2 },
                { id: 1, title: 'Oldest Post', content: 'Content 1', user_id: 1 }
            ];

            const mockOrderFn = jest.fn().mockResolvedValue({
                data: mockPosts,
                error: null
            });

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: mockOrderFn
                })
            });

            // Act
            await request(app).get('/api/posts');

            // Assert
            expect(mockOrderFn).toHaveBeenCalledWith('id', { ascending: false });
        });

        test('should include all required response fields', async () => {
            // Arrange
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                        data: [],
                        error: null
                    })
                })
            });

            // Act
            const response = await request(app)
                .get('/api/posts')
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('count');
            expect(response.body).toHaveProperty('timestamp');
            expect(typeof response.body.success).toBe('boolean');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(typeof response.body.count).toBe('number');
            expect(typeof response.body.timestamp).toBe('string');
        });
    });
});