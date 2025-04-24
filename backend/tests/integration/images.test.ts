// tests/integration/images.test.ts
import request from 'supertest';
import path from 'path';
import app from '../../src/app'; // Assuming your app is exported from this file
import { prisma } from '../../src/models/prisma';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com/test-image.jpg'),
  }));

// Mock authentication middleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  isAuth: (req, res, next) => {
    req.user = { id: 123, username: 'testuser' };
    next();
  }
}));

describe('Image API Endpoints', () => {
  beforeAll(async () => {
    // Setup test database
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup database connection
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Clear test data
    await prisma.image.deleteMany();
    
    // Mock S3Client
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));
  });

  describe('POST /api/images/user/avatar', () => {
    it('should upload user avatar successfully', async () => {
      // Setup mock database
      const mockCreate = jest.spyOn(prisma.image, 'create');
      mockCreate.mockResolvedValueOnce({
        id: 1,
        url: 'https://test-bucket.s3.region.amazonaws.com/images/test-image.jpg',
        key: 'images/test-image.jpg',
        userId: 123,
        chatId: null,
        messageId: null,
      });
      
      // Setup test file
      const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
      
      // Perform request
      const response = await request(app)
        .post('/api/images/user/avatar')
        .attach('image', testImagePath)
        .expect('Content-Type', /json/)
        .expect(201);
      
      // Check response
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('presignedUrl');
      expect(response.body.userId).toBe(123);
      
      // Verify database call
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 123,
        }),
      });
    });
    
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/images/user/avatar')
        .expect('Content-Type', /json/)
        .expect(400);
      
      expect(response.body).toHaveProperty('message', 'No file uploaded');
    });
  });
  
  describe('GET /api/images/user/:userId/avatar', () => {
    it('should get user avatar when it exists', async () => {
      // Setup mock database
      const mockFindUnique = jest.spyOn(prisma.image, 'findUnique');
      mockFindUnique.mockResolvedValueOnce({
        id: 1,
        url: 'https://test-bucket.s3.region.amazonaws.com/images/test-image.jpg',
        key: 'images/test-image.jpg',
        userId: 123,
        chatId: null,
        messageId: null,
      });
      
      // Mock getSignedUrl
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned-url.example.com');
      
      // Perform request
      const response = await request(app)
        .get('/api/images/user/123/avatar')
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Check response
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('presignedUrl', 'https://presigned-url.example.com');
      
      // Verify database call
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: 123 },
      });
    });
    
    it('should return 404 when user has no avatar', async () => {
      // Setup mock database
      const mockFindUnique = jest.spyOn(prisma.image, 'findUnique');
      mockFindUnique.mockResolvedValueOnce(null);
      
      // Perform request
      const response = await request(app)
        .get('/api/images/user/123/avatar')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'User has no avatar');
    });
  });
  
  // Add test cases for other endpoints (chat avatar, message image, delete endpoints)
});