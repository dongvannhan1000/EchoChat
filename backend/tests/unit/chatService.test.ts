// tests/unit/chatService.test.ts
import { Chat, UserChat } from '../../src/models/prisma';
import { ChatService } from '../../src/services/chatService';
import { ChatType } from '@prisma/client';

jest.mock('../../src/models/prisma', () => ({
  Chat: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  UserChat: {
    findMany: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ChatService', () => {
  const chatService = new ChatService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserChats', () => {
    it('should retrieve chats for a given user', async () => {
      const mockChats = [{ chat: { id: 1, participants: [], messages: [] } }];
      (UserChat.findMany as jest.Mock).mockResolvedValue(mockChats);

      const result = await chatService.getUserChats(1);
      
      expect(UserChat.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        select: expect.any(Object),
        orderBy: expect.any(Array),
      });
      expect(result).toEqual(mockChats);
    });

    it('should return an empty array if no chats are found', async () => {
      (UserChat.findMany as jest.Mock).mockResolvedValue([]);

      const result = await chatService.getUserChats(1);
      expect(result).toEqual([]);
    });
  });

  describe('createChat', () => {
    const mockCreatorId = 1;
    const mockData = {
      chatType: 'private' as ChatType,
      participantIds: [2],
    };

    it('should return existing private chat if found', async () => {
      const existingChat = { id: 1, participants: [] };
      (Chat.findFirst as jest.Mock).mockResolvedValue(existingChat);

      const result = await chatService.createChat(mockCreatorId, mockData);

      expect(Chat.findFirst).toHaveBeenCalled();
      expect(result).toEqual(existingChat);
    });

    it('should create a new chat if not found', async () => {
      (Chat.findFirst as jest.Mock).mockResolvedValue(null);
      const newChat = { id: 2, participants: [] };
      (Chat.create as jest.Mock).mockResolvedValue(newChat);

      const result = await chatService.createChat(mockCreatorId, mockData);

      expect(Chat.create).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          chatType: 'private',
          participants: {
            create: expect.any(Array),
          },
          createdBy: mockCreatorId,
          groupName: undefined,
          groupAvatar: undefined,
        },
      }));
      expect(result).toEqual(newChat);
    });
  });

  describe('getChatDetails', () => {
    it('should return chat details for a valid chatId and userId', async () => {
      const mockChat = { id: 1, participants: [] };
      (Chat.findFirst as jest.Mock).mockResolvedValue(mockChat);

      const result = await chatService.getChatDetails(1, 1);

      expect(Chat.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1, participants: { some: { userId: 1 } } },
      }));
      expect(result).toEqual(mockChat);
    });

    it('should throw an error if chat not found', async () => {
      (Chat.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(chatService.getChatDetails(1, 1)).rejects.toThrow('Chat not found or access denied');
    });
  });

  describe('leaveChat', () => {
    it('should remove user from chat and delete chat if no participants remain', async () => {
      const mockChat = { id: 1, chatType: 'group', participants: [{ userId: 1 }] };
      (Chat.findUnique as jest.Mock).mockResolvedValue(mockChat);
      (UserChat.delete as jest.Mock).mockResolvedValue({});
      (Chat.delete as jest.Mock).mockResolvedValue({});

      await chatService.leaveChat(1, 1);

      expect(UserChat.delete).toHaveBeenCalledWith({
        where: { userId_chatId: { userId: 1, chatId: 1 } },
      });
      expect(Chat.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw an error if trying to leave a private chat', async () => {
      const mockChat = { id: 1, chatType: 'private' };
      (Chat.findUnique as jest.Mock).mockResolvedValue(mockChat);

      await expect(chatService.leaveChat(1, 1)).rejects.toThrow('Cannot leave private chat');
    });

    it('should throw an error if chat not found', async () => {
      (Chat.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(chatService.leaveChat(1, 1)).rejects.toThrow('Chat not found');
    });
  });
});
