import { ChatType, ChatRole } from '@prisma/client';
import { Chat, UserChat } from '../models/prisma';

export class ChatService {

  // This function retrieves all chats that a user (`userId`) is involved in. It returns details about the chats, including participant information and the most recent message
  async getUserChats(userId: number) {
    return await UserChat.findMany({
      where: { userId }, 
      select: {
        id: true,
        chatId: true,
        chat: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    lastSeen: true,
                    statusMessage: true
                  }
                }
              }
            },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        lastMessage: true,
        isSeen: true,
        pinned: true,
        updatedAt: true
      },
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' }
      ]
    });
  }

  // Creating a new chat or returning an existing chat
  async createChat(creatorId: number, data: {
    chatType: ChatType;
    participantIds: number[];
    groupName?: string;
    groupAvatar?: string;
  }) {
    const { chatType, participantIds, groupName, groupAvatar } = data;
    
    if (chatType === 'private' && participantIds.length === 1) {
      const existingChat = await Chat.findFirst({
        where: {
          chatType: 'private',
          participants: {
            every: {
              userId: {
                in: [creatorId, participantIds[0]]
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      if (existingChat) {
        return existingChat;
      }
    }

    // Tạo chat mới
    return await Chat.create({
      data: {
        chatType,
        groupName,
        groupAvatar,
        createdBy: creatorId,
        participants: {
          create: [
            {
              userId: creatorId,
              role: ChatRole.admin,
              isSeen: true
            },
            ...participantIds.map(userId => ({
              userId,
              role: ChatRole.member,
              isSeen: false
            }))
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });
  }

  // Retrieving detailed information about a specific conversation that a user participates in
  async getChatDetails(chatId: number, userId: number) {
    const chat = await Chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                lastSeen: true,
                statusMessage: true
              }
            }
          }
        }
      }
    });

    if (!chat) {
      throw new Error('Chat not found or access denied');
    }

    return chat;
  }

  async leaveChat(chatId: number, userId: number) {
    const chat = await Chat.findUnique({
      where: { id: chatId },
      include: {
        participants: true
      }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.chatType === 'private') {
      throw new Error('Cannot leave private chat');
    }

    await UserChat.delete({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });

    if (chat.participants.length <= 1) {
      await Chat.delete({
        where: { id: chatId }
      });
    }
  }

  async markChatStatus(id: number, userId: number) {
    const userChat = await UserChat.findUnique({
      where: { 
        id: id,
        userId: userId 
      },
      include: { chat: true }
    });
  
    if (!userChat) {
      throw new Error('Chat not found');
    }
  
    return UserChat.update({
      where: { id: id },
      data: { 
        isSeen: !userChat.isSeen 
      }
    });
  }
}