import { Message, prisma, UserChat } from '../models/prisma';

export class MessageService {
  async getChatMessages(chatId: number, userId: number, cursor?: number, limit: number = 20) {
    const userChat = await UserChat.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });

    if (!userChat) {
      throw new Error('Access denied');
    }

    const messages = await Message.findMany({
      where: {
        chatId,
        ...(cursor ? {
          id: {
            lt: cursor 
          }
        } : {})
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1
    });

    const hasMore = messages.length > limit;
    const resultMessages = messages.slice(0, limit).reverse();

    await UserChat.update({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      },
      data: {
        isSeen: true
      }
    });

    return {
      messages: resultMessages,
      hasMore
    }
  }

  async sendMessage(data: {
    chatId: number;
    senderId: number;
    content?: string;
    image?: string;
    replyToId?: number;
  }) {
    const { chatId, senderId, content, image, replyToId } = data;

    const userChat = await UserChat.findUnique({
      where: {
        userId_chatId: {
          userId: senderId,
          chatId
        }
      }
    });

    if (!userChat) {
      throw new Error('Access denied');
    }

    const [message] = await prisma.$transaction([
      Message.create({
        data: {
          chatId,
          senderId,
          content,
          image,
          replyToId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),

      UserChat.updateMany({
        where: {
          chatId,
          userId: {
            not: senderId
          }
        },
        data: {
          isSeen: false,
          lastMessage: content || 'Sent an image',
          updatedAt: new Date()
        }
      })
    ]);

    return message;
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await Message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        deletedAt: null
      }
    });

    if (!message) {
      throw new Error('Message not found or already deleted');
    }

    return await Message.update({
      where: { id: messageId },
      data: {
        content: 'This message has been deleted.',
        deletedAt: new Date()
      }
    });
  }
}