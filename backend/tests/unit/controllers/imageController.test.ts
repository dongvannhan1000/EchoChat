// tests/unit/controllers/imageController.test.ts
import { getMockReq, getMockRes } from '@jest-mock/express';
import { 
  uploadUserAvatar, 
  uploadChatAvatar, 
  uploadMessageImage, 
  getUserAvatar,
  getChatAvatar,
  getMessageImage,
  deleteUserAvatar
} from '../../../src/controllers/imageController';
import { ImageService } from '../../../src/services/imageService';
import express from 'express';
import multer from 'multer';

// Mock the ImageService
jest.mock('../../../src/services/imageService');

describe('ImageController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadUserAvatar', () => {
    it('should upload user avatar successfully', async () => {
      // Mock data
      const mockFile = { 
        originalname: 'avatar.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg' 
      } as Express.Multer.File;
      
      const mockUser = { id: 123 };
      const mockImageMetadata = { 
        id: 1, 
        url: 'https://example.com/avatar', 
        key: 'images/avatar',
        presignedUrl: 'https://presigned-url.example.com'
      };
      
      // Setup mocks
      const mockReq = getMockReq({
        file: mockFile,
        user: mockUser
      });
      
      const { res, next, clearMockRes } = getMockRes();
      
      // Mock service response
      (ImageService.prototype.uploadImage as jest.Mock).mockResolvedValue(mockImageMetadata);
      
      // Execute
      await uploadUserAvatar(mockReq, res);
      
      // Assert
      expect(ImageService.prototype.uploadImage).toHaveBeenCalledWith(mockFile, 123);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockImageMetadata);
    });
    
    it('should return 400 when no file is uploaded', async () => {
      // Setup mocks
      const mockReq = getMockReq({
        user: { id: 123 },
        // No file
      });
      
      const { res, next, clearMockRes } = getMockRes();
      
      // Execute
      await uploadUserAvatar(mockReq, res);
      
      // Assert
      expect(ImageService.prototype.uploadImage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No file uploaded' });
    });
    
    it('should return 401 when user is not authenticated', async () => {
      // Setup mocks
      const mockReq = getMockReq({
        file: {} as Express.Multer.File,
        // No user
      });
      
      const { res, next, clearMockRes } = getMockRes();
      
      // Execute
      await uploadUserAvatar(mockReq, res);
      
      // Assert
      expect(ImageService.prototype.uploadImage).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
  
  describe('getUserAvatar', () => {
    it('should return user avatar when found', async () => {
      // Mock data
      const mockImage = { 
        id: 1, 
        url: 'https://example.com/avatar', 
        key: 'images/avatar',
        presignedUrl: 'https://presigned-url.example.com'
      };
      
      // Setup mocks
      const mockReq = getMockReq({
        params: { userId: '123' }
      });
      
      const { res, next, clearMockRes } = getMockRes();
      
      // Mock service response
      (ImageService.prototype.getImage as jest.Mock).mockResolvedValue(mockImage);
      
      // Execute
      await getUserAvatar(mockReq, res);
      
      // Assert
      expect(ImageService.prototype.getImage).toHaveBeenCalledWith('user', 123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockImage);
    });
    
    it('should return 404 when user has no avatar', async () => {
      // Setup mocks
      const mockReq = getMockReq({
        params: { userId: '123' }
      });
      
      const { res, next, clearMockRes } = getMockRes();
      
      // Mock service response
      (ImageService.prototype.getImage as jest.Mock).mockResolvedValue(null);
      
      // Execute
      await getUserAvatar(mockReq, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User has no avatar' });
    });
  });
  
  // Add similar tests for other controller methods...
});