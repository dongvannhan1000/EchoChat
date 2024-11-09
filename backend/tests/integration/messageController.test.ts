import request from 'supertest';
import app from '../../src/app'; 
import { MessageService } from '../../src/services/messageService';

// Mock MessageService
jest.mock('../../src/services/messageService');

const mockedMessageService = MessageService as jest.Mocked<typeof MessageService>;

jest.mock('../../src/middleware/authMiddleware', () => ({
  isAuth: jest.fn((req, res, next) => {
    console.log('isAuth called');
    req.user = { id: 1 };
    next();
  }),
}));


beforeAll(() => {
  
  

  (mockedMessageService.prototype.getChatMessages as jest.Mock).mockResolvedValue([
    { id: 1, content: 'Test message' },
  ]);
  (mockedMessageService.prototype.sendMessage as jest.Mock).mockResolvedValue({
    id: 2,
    content: 'New message',
    senderId: 1,
    chatId: 1,
  });
  (mockedMessageService.prototype.deleteMessage as jest.Mock).mockResolvedValue({
    id: 1,
    content: 'Test message',
    deletedAt: new Date(),
  });
});

describe('Message Controller', () => {
  describe('GET /api/chats/:chatId/messages', () => {
    it('should return messages for a chat', async () => {
      const response = await request(app)
        .get('/api/chats/1/messages')
        .set('Authorization', 'Bearer mock_token'); // Set token giả để test

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toBe('Test message');
    });

    it('should return 500 if message service throws an error', async () => {
      (mockedMessageService.prototype.getChatMessages as jest.Mock).mockRejectedValue(new Error('Error fetching messages'));

      const response = await request(app)
        .get('/api/chats/1/messages')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error fetching messages');
    });
  });

  describe('POST /api/chats/:chatId/messages', () => {
    it('should send a message', async () => {
      const response = await request(app)
        .post('/api/chats/1/messages')
        .set('Authorization', 'Bearer mock_token')
        .send({ content: 'New message' });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('New message');
      expect(response.body.senderId).toBe(1);
      expect(response.body.chatId).toBe(1);
    });

    it('should return 500 if message sending fails', async () => {
      (mockedMessageService.prototype.sendMessage as jest.Mock).mockRejectedValue(new Error('Failed to send message'));

      const response = await request(app)
        .post('/api/chats/1/messages')
        .set('Authorization', 'Bearer mock_token')
        .send({ content: 'New message' });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to send message');
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    it('should delete a message', async () => {
      const response = await request(app)
        .delete('/api/messages/1')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Message deleted');
    });

    it('should return 500 if message deletion fails', async () => {
      (mockedMessageService.prototype.deleteMessage as jest.Mock).mockRejectedValue(new Error('Failed to delete message'));

      const response = await request(app)
        .delete('/api/messages/1')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Failed to delete message');
    });
  });
});
