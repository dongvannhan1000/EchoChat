import { PresignedUrlService } from '../../../src/services/presignedUrlService';
import { prisma } from '../../../src/models/prisma';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock imports
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../../src/models/prisma', () => require('../../../__mocks__/prisma'));

describe('PresignedUrlService', () => {
  let service: PresignedUrlService;
  
  // Setup environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset environment 
    process.env = {
      ...originalEnv,
      AWS_S3_BUCKET_NAME: 'test-bucket',
      AWS_REGION: 'test-region',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      CLOUDFRONT_DOMAIN: 'test.cloudfront.net'
    };
    
    service = new PresignedUrlService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('generateAvatarPresignedUrl', () => {
    it('should generate a presigned URL for user avatar', async () => {
      // Mock prisma user findUnique
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User'
      });

      // Mock getSignedUrl 
      (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned-url.com');

      const result = await service.generateAvatarPresignedUrl(1, 'image/jpeg');

      // Check the result
      expect(result).toHaveProperty('presignedUrl', 'https://presigned-url.com');
      expect(result).toHaveProperty('fileKey');
      expect(result.fileKey).toContain('avatars/1/');
      expect(result.fileKey).toMatch(/\.jpg$/);
      expect(result).toHaveProperty('cloudFrontUrl');
      expect(result.cloudFrontUrl).toContain('test.cloudfront.net');

      // Verify database calls
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(prisma.pendingUpload.create).toHaveBeenCalled();
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should throw an error if user not found', async () => {
      // Mock user not found
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.generateAvatarPresignedUrl(1, 'image/jpeg'))
        .rejects.toThrow('Failed to generate upload URL');
    });

    it('should handle existing user avatar', async () => {
      // Mock prisma responses
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.image.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: 1,
        key: 'old-key.jpg'
      });

      await service.generateAvatarPresignedUrl(1, 'image/jpeg');

      // Verify pendingUpload has previousKey
      expect(prisma.pendingUpload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            previousKey: 'old-key.jpg'
          })
        })
      );
    });
  });

  describe('generateChatAvatarPresignedUrl', () => {
    it('should generate a presigned URL for chat avatar', async () => {
      // Mock prisma chat findUnique
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Chat',
        participants: [{ userId: 1 }]
      });

      const result = await service.generateChatAvatarPresignedUrl(1, 1, 'image/png');

      // Check the result
      expect(result).toHaveProperty('presignedUrl');
      expect(result).toHaveProperty('fileKey');
      expect(result.fileKey).toContain('chats/1/avatar/');
      expect(result.fileKey).toMatch(/\.png$/);

      // Verify database calls
      expect(prisma.chat.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          participants: {
            where: { userId: 1 }
          }
        }
      });
      expect(prisma.pendingUpload.create).toHaveBeenCalled();
    });

    it('should throw an error if chat not found', async () => {
      // Mock chat not found
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.generateChatAvatarPresignedUrl(1, 1, 'image/png'))
        .rejects.toThrow('Failed to generate upload URL');
    });

    it('should throw an error if user is not a participant', async () => {
      // Mock chat with empty participants
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        participants: []
      });

      await expect(service.generateChatAvatarPresignedUrl(1, 1, 'image/png'))
        .rejects.toThrow('Failed to generate upload URL');
    });
  });

  describe('generateMessageImagePresignedUrl', () => {
    it('should generate a presigned URL for message image', async () => {
      // Mock prisma chat findUnique
      (prisma.chat.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Chat',
        participants: [{ userId: 1 }]
      });

      const result = await service.generateMessageImagePresignedUrl(1, 1, 'image/gif');

      // Check the result
      expect(result).toHaveProperty('presignedUrl');
      expect(result).toHaveProperty('fileKey');
      expect(result.fileKey).toContain('chats/1/messages/');
      expect(result.fileKey).toMatch(/\.gif$/);

      // Verify database calls
      expect(prisma.chat.findUnique).toHaveBeenCalled();
      expect(prisma.pendingUpload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'message',
            referenceId: 1,
            userId: 1
          })
        })
      );
    });
  });

  describe('confirmUpload', () => {
    it('should confirm a user avatar upload', async () => {
      // Mock pendingUpload find
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        key: 'avatars/1/test.jpg',
        type: 'user',
        referenceId: 1,
        previousKey: null,
        expiresAt: new Date()
      });

      const result = await service.confirmUpload('avatars/1/test.jpg', 'user');

      // Check result
      expect(result).toEqual({
        success: true,
        cloudFrontUrl: expect.stringContaining('test.cloudfront.net')
      });

      // Verify database transactions
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'avatars/1/test.jpg',
          userId: 1
        })
      });
      expect(prisma.pendingUpload.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should replace existing image if previous key exists', async () => {
      // Mock pendingUpload with previousKey
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        key: 'avatars/1/new.jpg',
        type: 'user',
        referenceId: 1,
        previousKey: 'avatars/1/old.jpg',
        expiresAt: new Date()
      });

      await service.confirmUpload('avatars/1/new.jpg', 'user');

      // Verify old image was deleted
      expect(prisma.image.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: 1 },
            { chatId: undefined },
            { messageId: undefined }
          ]
        }
      });
    });

    it('should handle message image uploads', async () => {
      // Mock pendingUpload for message
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        key: 'chats/1/messages/test.jpg',
        type: 'message',
        referenceId: 1, // chat ID
        userId: 2,
        expiresAt: new Date()
      });

      await service.confirmUpload('chats/1/messages/test.jpg', 'message', 123);

      // Verify image creation with messageId
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          key: 'chats/1/messages/test.jpg',
          messageId: 123
        })
      });
    });

    it('should throw error if no pending upload found', async () => {
      // Mock no pendingUpload found
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.confirmUpload('nonexistent.jpg', 'user'))
        .rejects.toThrow('Failed to confirm upload');
    });

    it('should throw error if messageId missing for message type', async () => {
      // Mock pendingUpload for message but missing messageId
      (prisma.pendingUpload.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        key: 'chats/1/messages/test.jpg',
        type: 'message',
        referenceId: 1,
        expiresAt: new Date()
      });

      await expect(service.confirmUpload('chats/1/messages/test.jpg', 'message'))
        .rejects.toThrow('Failed to confirm upload');
    });
  });

  describe('cleanupExpiredUploads', () => {
    it('should delete expired pending uploads', async () => {
      // Mock finding expired uploads
      const mockExpired = [
        { id: 1, key: 'expired1.jpg' },
        { id: 2, key: 'expired2.jpg' }
      ];
      (prisma.pendingUpload.findMany as jest.Mock).mockResolvedValue(mockExpired);
      
      const result = await service.cleanupExpiredUploads();
      
      expect(result).toEqual({ deleted: 2 });
      expect(prisma.pendingUpload.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });
});