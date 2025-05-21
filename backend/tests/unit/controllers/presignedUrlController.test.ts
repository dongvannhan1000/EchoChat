import { Request, Response } from 'express';
import * as controller from '../../../src/controllers/presignedUrlController';
import { presignedUrlService } from '../../../src/services/presignedUrlService';

// Mock services
jest.mock('../../../src/services/presignedUrlService', () => ({
  presignedUrlService: {
    generateAvatarPresignedUrl: jest.fn(),
    generateChatAvatarPresignedUrl: jest.fn(),
    generateMessageImagePresignedUrl: jest.fn(),
    confirmUpload: jest.fn()
  }
}));

describe('PresignedUrlController', () => {
  let mockReq: Partial<Request & { user?: { id: number } }>;
  let mockRes: Partial<Response>;
  
  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      body: {},
      params: {},
      get: jest.fn()
    }
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reset mocks
    jest.clearAllMocks();

    
    // Setup mock for PresignedUrlService
  });
  
  describe('generateUserAvatarUrl', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock unauthenticated request
      mockReq.user = undefined;
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
    
    it('should return 400 if content type is missing', async () => {
      mockReq.body = {};
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid image content type is required' });
    });
    
    it('should return 400 if content type is not image', async () => {
      mockReq.body = { contentType: 'application/pdf' };
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Valid image content type is required' });
    });
    
    it('should return 400 if file size exceeds limit', async () => {
      mockReq.body = { contentType: 'image/jpeg' };
      (mockReq.get as jest.Mock).mockReturnValue('6000000'); // > 5MB
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'File size exceeds the 5MB limit' });
    });
    
    it('should return presigned URL data on success', async () => {
      mockReq.body.contentType = 'image/jpeg';
      (mockReq.get as jest.Mock).mockReturnValue('0');
      
      const mockUrlData = {
        presignedUrl: 'https://presigned-url.com',
        fileKey: 'avatars/1/test.jpg',
        cloudFrontUrl: 'https://cdn.example.com/avatars/1/test.jpg'
      };
      
      (presignedUrlService.generateAvatarPresignedUrl as jest.Mock).mockResolvedValue(mockUrlData);
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(presignedUrlService.generateAvatarPresignedUrl).toHaveBeenCalledWith(1, 'image/jpeg');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUrlData);
    });
    
    it('should handle service errors', async () => {
      mockReq.body = { contentType: 'image/jpeg' };
      
      const error = new Error('Service error');
      (presignedUrlService.generateAvatarPresignedUrl as jest.Mock).mockRejectedValue(error);
      
      await controller.generateUserAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to generate upload URL',
        error: 'Service error'
      });
    });
  });
  
  describe('generateChatAvatarUrl', () => {
    beforeEach(() => {
      mockReq.params = { chatId: '2' };
      mockReq.body = { contentType: 'image/png' };
    });
    
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
    
    it('should return 400 if chat ID is invalid', async () => {
      mockReq.params = { chatId: 'invalid' };
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid chat ID' });
    });
    
    it('should return 400 if content type is not image', async () => {
      mockReq.body = { contentType: 'text/plain' };
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
    
    it('should return presigned URL data on success', async () => {
      const mockUrlData = {
        presignedUrl: 'https://presigned-url.com',
        fileKey: 'chats/2/avatar/test.png',
        cloudFrontUrl: 'https://cdn.example.com/chats/2/avatar/test.png'
      };
      
      (presignedUrlService.generateChatAvatarPresignedUrl as jest.Mock).mockResolvedValue(mockUrlData);
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(presignedUrlService.generateChatAvatarPresignedUrl).toHaveBeenCalledWith(2, 1, 'image/png');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUrlData);
    });
    
    it('should return 404 for "not found" errors', async () => {
      const error = new Error('Chat not found');
      (presignedUrlService.generateChatAvatarPresignedUrl as jest.Mock).mockRejectedValue(error);
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
    
    it('should return 404 for "not a participant" errors', async () => {
      const error = new Error('User is not a participant in this chat');
      (presignedUrlService.generateChatAvatarPresignedUrl as jest.Mock).mockRejectedValue(error);
      
      await controller.generateChatAvatarUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
  
  describe('generateMessageImageUrl', () => {
    beforeEach(() => {
      mockReq.params = { chatId: '3' };
      mockReq.body = { contentType: 'image/gif' };
    });
    
    it('should validate user authentication and chat ID', async () => {
      mockReq.user = undefined;
      
      await controller.generateMessageImageUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      
      // Reset and test invalid chat ID
      mockReq.user = { id: 1 };
      mockReq.params = { chatId: 'abc' };
      
      await controller.generateMessageImageUrl(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
    
    it('should return presigned URL data on success', async () => {
      const mockUrlData = {
        presignedUrl: 'https://presigned-url.com',
        fileKey: 'chats/3/messages/test.gif',
        cloudFrontUrl: 'https://cdn.example.com/chats/3/messages/test.gif'
      };
      
      (presignedUrlService.generateMessageImagePresignedUrl as jest.Mock).mockResolvedValue(mockUrlData);
      
      await controller.generateMessageImageUrl(mockReq as Request, mockRes as Response);
      
      expect(presignedUrlService.generateMessageImagePresignedUrl).toHaveBeenCalledWith(3, 1, 'image/gif');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUrlData);
    });
  });
  
  describe('confirmUpload', () => {
    beforeEach(() => {
      mockReq.body = {
        fileKey: 'avatars/1/test.jpg',
        type: 'user'
      };
    });
    
    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
    
    it('should return 400 if fileKey or type is missing', async () => {
      mockReq.body = { type: 'user' }; // missing fileKey
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      
      mockReq.body = { fileKey: 'test.jpg' }; // missing type
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
    
    it('should return 400 if type is invalid', async () => {
      mockReq.body = { 
        fileKey: 'test.jpg', 
        type: 'invalid' 
      };
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid type. Must be user, chat, or message' });
    });
    
    it('should return 400 if messageId is missing for message type', async () => {
      mockReq.body = { 
        fileKey: 'chats/1/messages/test.jpg', 
        type: 'message' 
      };
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Message ID is required for message image uploads' });
    });
    
    it('should confirm upload on success', async () => {
      const mockResult = {
        success: true,
        cloudFrontUrl: 'https://cdn.example.com/avatars/1/test.jpg'
      };
      
      (presignedUrlService.confirmUpload as jest.Mock).mockResolvedValue(mockResult);
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(presignedUrlService.confirmUpload).toHaveBeenCalledWith('avatars/1/test.jpg', 'user', undefined);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
    
    it('should confirm message upload with messageId', async () => {
      mockReq.body = {
        fileKey: 'chats/1/messages/test.jpg',
        type: 'message',
        messageId: '123'
      };
      
      (presignedUrlService.confirmUpload as jest.Mock).mockResolvedValue({ 
        success: true, 
        cloudFrontUrl: 'https://example-cloudfront.net/chats/1/messages/test.jpg' 
      });
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(presignedUrlService.confirmUpload).toHaveBeenCalledWith('chats/1/messages/test.jpg', 'message', 123);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        cloudFrontUrl: 'https://example-cloudfront.net/chats/1/messages/test.jpg'
      });
    });
    
    it('should handle service errors', async () => {
      const error = new Error('Confirmation failed');
      (presignedUrlService.confirmUpload as jest.Mock).mockRejectedValue(error);
      
      await controller.confirmUpload(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});