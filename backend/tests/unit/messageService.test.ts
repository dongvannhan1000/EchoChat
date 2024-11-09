import { MessageService } from '../../src/services/messageService';
import { UserChat, Message } from '../../src/models/prisma';
import { prisma } from '../../src/models/prisma';

// Mock các models của Prisma
jest.mock('../../src/models/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    message: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    userChat: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    }
  },
  UserChat: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn()
  },
  Message: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn()
  }
}));

describe('MessageService', () => {
  const messageService = new MessageService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatMessages', () => {
    it('should fetch messages when user has access to chat', async () => {
      const mockMessages = [
        { id: 1, content: 'Hello', sender: { id: 1, name: 'Alice', avatar: 'alice.png' } },
        { id: 2, content: 'Hi', sender: { id: 2, name: 'Bob', avatar: 'bob.png' } }
      ];

      (UserChat.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 1, chatId: 1 });
      (Message.findMany as jest.Mock).mockResolvedValueOnce(mockMessages);
      (UserChat.update as jest.Mock).mockResolvedValueOnce({ userId: 1, chatId: 1, isSeen: true });

      const messages = await messageService.getChatMessages(1, 1, undefined, 20);

      expect(messages).toEqual(mockMessages);
      expect(UserChat.findUnique).toHaveBeenCalledWith({
        where: { userId_chatId: { userId: 1, chatId: 1 } }
      });
      expect(Message.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { chatId: 1, deletedAt: null }
      }));
    });

    it('should throw an error if user does not have access to chat', async () => {
      (UserChat.findUnique as jest.Mock).mockResolvedValueOnce(null);  // No access

      await expect(messageService.getChatMessages(1, 1, undefined, 20)).rejects.toThrow('Access denied');
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = { id: 1, content: 'Hello', senderId: 1, chatId: 1, sender: { id: 1, name: 'Alice', avatar: 'alice.png' } };
      const sendMessageData = { chatId: 1, senderId: 1, content: 'Hello' };

      (UserChat.findUnique as jest.Mock).mockResolvedValueOnce({ userId: 1, chatId: 1 });
      (prisma.$transaction as jest.Mock).mockResolvedValueOnce([mockMessage]);

      const message = await messageService.sendMessage(sendMessageData);

      expect(message).toEqual(mockMessage);
      expect(UserChat.findUnique).toHaveBeenCalledWith({
        where: { userId_chatId: { userId: 1, chatId: 1 } }
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw an error if user does not have access to chat', async () => {
      (UserChat.findUnique as jest.Mock).mockResolvedValueOnce(null);  // No access

      const sendMessageData = { chatId: 1, senderId: 1, content: 'Hello' };

      await expect(messageService.sendMessage(sendMessageData)).rejects.toThrow('Access denied');
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message successfully', async () => {
      const mockMessage = { id: 1, content: 'Hello', senderId: 1, deletedAt: null };

      (Message.findFirst as jest.Mock).mockResolvedValueOnce(mockMessage);
      (Message.update as jest.Mock).mockResolvedValueOnce({ ...mockMessage, deletedAt: new Date() });

      const response = await messageService.deleteMessage(1, 1);

      expect(response).toEqual({ ...mockMessage, deletedAt: expect.any(Date) });
      expect(Message.findFirst).toHaveBeenCalledWith({
        where: { id: 1, senderId: 1, deletedAt: null }
      });
      expect(Message.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) }
      });
    });

    it('should throw an error if message not found or already deleted', async () => {
      (Message.findFirst as jest.Mock).mockResolvedValueOnce(null);  // Message not found

      await expect(messageService.deleteMessage(1, 1)).rejects.toThrowError('Message not found or already deleted');
    });
  });
});
