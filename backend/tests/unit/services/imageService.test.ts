import { ImageService } from '../../../src/services/imageService';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../../../src/models/prisma';
import express from 'express';
import multer from 'multer';


jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn()
  };
});
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('../../../src/models/prisma', () => ({
  prisma: {
    image: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ImageService', () => {
  let imageService: ImageService;
  
  beforeEach(() => {
    
    // Reset mocks
    jest.clearAllMocks();
    
    
    // Mock getSignedUrl
    (getSignedUrl as jest.Mock).mockResolvedValue('https://presigned-url.example.com');
    
    imageService = new ImageService();
  });
  
  describe('uploadImage', () => {
    const mockFile = {
      originalname: 'test-image.jpg',
      buffer: Buffer.from('test image content'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;
    
    it('should upload a new user avatar when none exists', async () => {
      // Setup mocks
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.image.create as jest.Mock).mockResolvedValue({
        id: 1,
        url: 'https://test-bucket.s3.test-region.amazonaws.com/images/test-key',
        key: 'images/test-key',
        userId: 123,
      });
      
      // Execute
      const result = await imageService.uploadImage(mockFile, 123);
      
      // Assert
      expect(prisma.image.findUnique).toHaveBeenCalledWith({ where: { userId: 123 } });
      expect(prisma.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 123,
        }),
      });
      expect(result).toHaveProperty('presignedUrl');
    });
    
    it('should replace existing user avatar', async () => {
      // Setup mocks
      const existingImage = {
        id: 1,
        url: 'https://old-url.com',
        key: 'images/old-key',
        userId: 123,
      };
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(existingImage);
      (prisma.image.update as jest.Mock).mockResolvedValue({
        ...existingImage,
        url: 'https://test-bucket.s3.test-region.amazonaws.com/images/new-key',
        key: 'images/new-key',
      });
      
      // Execute
      const result = await imageService.uploadImage(mockFile, 123);
      
      // Assert
      expect(prisma.image.findUnique).toHaveBeenCalledWith({ where: { userId: 123 } });
      expect(prisma.image.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          url: expect.any(String),
          key: expect.any(String),
        }),
      });
    });
    
    it('should throw error when no identifier is provided', async () => {
      await expect(imageService.uploadImage(mockFile)).rejects.toThrow(
        'Exactly one of userId, chatId, or messageId must be provided'
      );
    });
  });
  
  describe('getImage', () => {
    it('should return image with presigned URL when found', async () => {
      // Setup mocks
      const existingImage = {
        id: 1,
        url: 'https://example.com/image',
        key: 'images/test-key',
        userId: 123,
      };
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(existingImage);
      
      // Execute
      const result = await imageService.getImage('user', 123);
      
      // Assert
      expect(prisma.image.findUnique).toHaveBeenCalledWith({ where: { userId: 123 } });
      expect(result).toEqual({
        ...existingImage,
        presignedUrl: 'https://presigned-url.example.com',
      });
      expect(getSignedUrl).toHaveBeenCalled();
    });
    
    it('should return null when image not found', async () => {
      // Setup mocks
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await imageService.getImage('user', 123);
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('deleteImage', () => {
    it('should delete image when found', async () => {
      // Setup mocks
      const existingImage = {
        id: 1,
        url: 'https://example.com/image',
        key: 'images/test-key',
        userId: 123,
      };
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(existingImage);
      (prisma.image.delete as jest.Mock).mockResolvedValue(existingImage);
      
      // Execute
      const result = await imageService.deleteImage('user', 123);
      
      // Assert
      expect(prisma.image.findUnique).toHaveBeenCalledWith({ where: { userId: 123 } });
      expect(prisma.image.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true, message: 'Image deleted successfully' });
    });
    
    it('should throw error when image not found', async () => {
      // Setup mocks
      (prisma.image.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Execute & Assert
      await expect(imageService.deleteImage('user', 123)).rejects.toThrow('Image not found');
    });
  });
});