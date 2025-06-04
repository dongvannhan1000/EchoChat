import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import presignedUrlRoutes from '../../src/routes/presignedUrlRoutes';
import { prisma } from '../../src/models/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock dependencies
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../src/models/prisma', () => require('../../__mocks__/prisma'));
jest.mock('../../src/middleware/authMiddleware', () => ({
  isAuth: (req: any, res: any, next: any) => {
    req.user = { id: 1 };
    next();
  }
}));

describe('Presigned URL Integration Tests', () => {
  let app: express.Express;
  let server: Server;
  
  beforeAll(() => {
    // Set up required env variables
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'test-region';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.CLOUDFRONT_DOMAIN = 'test-cdn.example.com';
    
    // Setup the Express app with routes
    app = express();
    app.use(express.json());
    app.use(presignedUrlRoutes);
    
    // Start the server
    server = app.listen(0);
  });
  
  afterAll((done) => {
    // Close the server
    server.close(done);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getSignedUrl to return a test URL
    (getSignedUrl as jest.Mock).mockResolvedValue('https://test-signed-url.com');
  });
  
  describe('User Avatar Flow', () => {
    it('should generate URL and confirm upload for user avatar', async () => {
      // Mock user exists
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User'
      });
      
      // Mock pendingUpload creation
      (prisma.pendingUpload.create as jest.Mock).mockResolvedValue({
        id: 1,
        key: 'avatars/1/test-uuid.jpg',
        type: 'user',
        referenceId: 1,
        expiresAt: new Date()
      });
      
      // Step 1: Request presigned URL
      const presignResponse = await request(app)
        .post('/api/avatar/presign')
        .send({ contentType: 'image/jpeg' })
        .expect(200);
      
      expect(presignResponse.body).toHaveProperty('presignedUrl');
      expect(presignResponse.body).toHaveProperty('fileKey');
      
      const { fileKey } = presignResponse.body;
      expect(fileKey).toMatch(/^avatars\/1\/.+\.jpg$/);
      
      // Mock finding the pending upload
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        key: fileKey,
        type: 'user',
        referenceId: 1,
        expiresAt: new Date()
      });
      
      // Step 2: Confirm upload
      const confirmResponse = await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey, type: 'user' })
        .expect(200);
      
      expect(confirmResponse.body).toHaveProperty('success', true);
      expect(confirmResponse.body).toHaveProperty('cloudFrontUrl');
      expect(confirmResponse.body.cloudFrontUrl).toContain('test-cdn.example.com');
      
      // Check that we created the image record
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: fileKey,
          userId: 1
        })
      });
      
      // Check that we deleted the pending upload
      expect(prisma.pendingUpload.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
    
    it('should reject upload confirmation if pending upload not found', async () => {
      // No pending upload found
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue(null);
      
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey: 'nonexistent.jpg', type: 'user' })
        .expect(500);
    });
  });
  
  describe('Chat Avatar Flow', () => {
    it('should generate URL and confirm upload for chat avatar', async () => {
      // Mock chat exists with current user as participant
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'Test Chat',
        participants: [{ userId: 1 }]
      });
      
      // Step 1: Request presigned URL
      const presignResponse = await request(app)
        .post('/api/chats/2/avatar/presign')
        .send({ contentType: 'image/png' })
        .expect(200);
      
      expect(presignResponse.body).toHaveProperty('fileKey');
      const { fileKey } = presignResponse.body;
      
      // Mock finding the pending upload
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        key: fileKey,
        type: 'chat',
        referenceId: 2,
        expiresAt: new Date()
      });
      
      // Step 2: Confirm upload
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey, type: 'chat' })
        .expect(200);
      
      // Check that we created the image record
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: fileKey,
          chatId: 2
        })
      });
    });
    
    it('should reject if user is not a chat participant', async () => {
      // Mock chat without the user as participant
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'Private Chat',
        participants: [] // Empty array means user not a participant
      });
      
      await request(app)
        .post('/api/chats/3/avatar/presign')
        .send({ contentType: 'image/png' })
        .expect(500);
    });
  });
  
  describe('Message Image Flow', () => {
    it('should generate URL and confirm upload for message image', async () => {
      // Mock chat exists with current user as participant
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 4,
        name: 'Test Chat',
        participants: [{ userId: 1 }]
      });
      
      // Step 1: Request presigned URL
      const presignResponse = await request(app)
        .post('/api/chats/4/message/presign')
        .send({ contentType: 'image/gif' })
        .expect(200);
      
      expect(presignResponse.body).toHaveProperty('fileKey');
      const { fileKey } = presignResponse.body;
      
      // Mock finding the pending upload
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 3,
        key: fileKey,
        type: 'message',
        referenceId: 4, // chat ID
        userId: 1,
        expiresAt: new Date()
      });

      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        id: 101,
        content: 'Test message',
        chatId: 4,
        userId: 1
      });

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      (prisma.image.create as jest.Mock).mockResolvedValue({
        id: 1,
        url: expect.any(String),
        key: fileKey,
        messageId: 101
      });

      (prisma.message.update as jest.Mock).mockResolvedValue({
        id: 101,
        imageId: 1
      });

      (prisma.pendingUpload.delete as jest.Mock).mockResolvedValue({});
      
      // Step 2: Confirm upload with message ID (now that message is created)
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey, type: 'message', messageId: '101' })
        .expect(200);
      
      // Check that we created the image record with messageId
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: fileKey,
          messageId: 101
        })
      });
    });
    
    it('should reject message upload confirmation without messageId', async () => {
      // Mock finding the pending upload
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 4,
        key: 'chats/5/messages/test.jpg',
        type: 'message',
        referenceId: 5,
        userId: 1,
        expiresAt: new Date()
      });
      
      // Try to confirm without messageId
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey: 'chats/5/messages/test.jpg', type: 'message' })
        .expect(400);
    });
  });
  
  describe('Error Handling', () => {
    it('should validate content type properly', async () => {
      await request(app)
        .post('/api/avatar/presign')
        .send({ contentType: 'application/pdf' }) // Not an image
        .expect(400);
    });
    
    it('should handle AWS errors gracefully', async () => {
      // Mock user exists
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1
      });
      
      // Mock AWS error
      (getSignedUrl as jest.Mock).mockRejectedValue(new Error('AWS Service Error'));
      
      await request(app)
        .post('/api/avatar/presign')
        .send({ contentType: 'image/jpeg' })
        .expect(500);
    });
  });
});