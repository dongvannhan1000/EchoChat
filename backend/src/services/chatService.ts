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
                user: true
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
            user: true
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

  async markChatStatus(id: number, forceMarkAsSeen?: boolean) {
    const userChat = await UserChat.findUnique({
      where: { 
        id: id
      },
      include: { chat: true }
    });
  
    if (!userChat) {
      throw new Error('Chat not found');
    }

    const newSeenStatus = forceMarkAsSeen !== undefined 
      ? forceMarkAsSeen 
      : !userChat.isSeen;
  
    return UserChat.update({
      where: { id: id },
      data: { 
        isSeen: newSeenStatus
      }
    });
  }

  async pinChat(id: number) {
    const userChat = await UserChat.findUnique({
      where: { 
        id: id
      },
      include: { chat: true }
    });
  
    if (!userChat) {
      throw new Error('Chat not found');
    }

    return UserChat.update({
      where: { id: id },
      data: { 
        pinned: !userChat.pinned 
      }
    });
  }

  async muteChat(id: number, muteDuration?: number) {
    const userChat = await UserChat.findUnique({
      where: { 
        id: id
      },
      include: { chat: true }
    });
  
    if (!userChat) {
      throw new Error('Chat not found');
    }

    // Calculate mutedUntil date if duration is provided
    let mutedUntil;

    if (muteDuration === 0) {
      // Unmute: set mutedUntil to null
      mutedUntil = null;
    } else if (muteDuration === undefined) {

      mutedUntil = new Date('2030-12-31T23:59:59Z');
    } else {
      // Mute for a specific duration
      mutedUntil = new Date(Date.now() + muteDuration * 1000);
    }

    console.log('Updating mutedUntil to:', mutedUntil);

    return UserChat.update({
      where: { id: id },
      data: { 
        mutedUntil: mutedUntil
      }
    });
  }
}