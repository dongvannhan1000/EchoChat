import request from 'supertest';
import express, { Express } from 'express';
import presignedUrlRoutes from '../../src/routes/presignedUrlRoutes';
import { isAuth } from '../../src/middleware/authMiddleware';
import * as controller from '../../src/controllers/presignedUrlController';

// Mock middleware and controllers
jest.mock('../../src/middleware/authMiddleware');
jest.mock('../../src/controllers/presignedUrlController');

describe('PresignedUrl Routes', () => {
  let app: Express;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock auth middleware to pass through 
    (isAuth as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 1 }; // Add mock user
      next();
    });
    
    // Setup express app with routes
    app = express();
    app.use(express.json());
    app.use(presignedUrlRoutes);
  });
  
  describe('POST /api/avatar/presign', () => {
    it('should route to generateUserAvatarUrl controller', async () => {
      // Mock controller
      (controller.generateUserAvatarUrl as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });
      
      await request(app)
        .post('/api/avatar/presign')
        .send({ contentType: 'image/jpeg' })
        .expect(200);
      
      expect(isAuth).toHaveBeenCalled();
      expect(controller.generateUserAvatarUrl).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/chats/:chatId/avatar/presign', () => {
    it('should route to generateChatAvatarUrl controller', async () => {
      (controller.generateChatAvatarUrl as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });
      
      await request(app)
        .post('/api/chats/1/avatar/presign')
        .send({ contentType: 'image/png' })
        .expect(200);
      
      expect(isAuth).toHaveBeenCalled();
      expect(controller.generateChatAvatarUrl).toHaveBeenCalled();
    });
    
    it('should pass chatId as route parameter', async () => {
      (controller.generateChatAvatarUrl as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ chatId: req.params.chatId });
      });
      
      const response = await request(app)
        .post('/api/chats/123/avatar/presign')
        .send({ contentType: 'image/png' });
      
      expect(response.body.chatId).toBe('123');
    });
  });
  
  describe('POST /api/chats/:chatId/message/presign', () => {
    it('should route to generateMessageImageUrl controller', async () => {
      (controller.generateMessageImageUrl as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });
      
      await request(app)
        .post('/api/chats/2/message/presign')
        .send({ contentType: 'image/gif' })
        .expect(200);
      
      expect(isAuth).toHaveBeenCalled();
      expect(controller.generateMessageImageUrl).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/upload/confirm', () => {
    it('should route to confirmUpload controller', async () => {
      (controller.confirmUpload as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });
      
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey: 'test.jpg', type: 'user' })
        .expect(200);
      
      expect(isAuth).toHaveBeenCalled();
      expect(controller.confirmUpload).toHaveBeenCalled();
    });
    
    it('should reject unauthenticated requests', async () => {
      // Override auth middleware to simulate auth failure
      (isAuth as jest.Mock).mockImplementation((req, res, next) => {
        res.status(401).json({ message: 'Unauthorized' });
      });
      
      await request(app)
        .post('/api/upload/confirm')
        .send({ fileKey: 'test.jpg', type: 'user' })
        .expect(401);
      
      expect(controller.confirmUpload).not.toHaveBeenCalled();
    });
  });
});