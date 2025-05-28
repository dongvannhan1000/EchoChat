import { Chat, Message, prisma, UserChat } from '../models/prisma';
import { MessageType } from '@prisma/client';
import { presignedUrlService } from './presignedUrlService';

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
        },
        image: true
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
    };
  }

  async sendMessage(data: {
    chatId: number;
    senderId: number;
    type: MessageType;
    content?: string;
    imageFileKey?: string;
    replyToId?: number;
  }) {

    console.log('sendMessage called with data:', data);
    const { chatId, senderId, type, content, imageFileKey, replyToId } = data;

    

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

    

    const message = await prisma.$transaction(async (tx) => {
      // Tạo bản ghi Image nếu có

      // Tạo message với imageId (nếu có)
      const message = await tx.message.create({
        data: {
          chatId,
          senderId,
          type,
          content,
          replyToId,
        },
        include: {
          sender: true,
          chat: true,
        }
      });

      await tx.userChat.updateMany({
        where: {
          chatId,
          userId: {
            not: senderId
          }
        },
        data: {
          isSeen: false,
          updatedAt: new Date()
        }
      });

      return message;
    });

    if (imageFileKey) {
      console.log('Starting confirmUpload for message:', message.id);
      await presignedUrlService.confirmUpload(imageFileKey, 'message', message.id);
      console.log('confirmUpload completed for message:', message.id);
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: content || 'Sent an image',
        updatedAt: new Date()
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
      // nếu muốn lấy thêm field nào khác thì include hoặc select ở đây
    });

    const finalMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: true,
        chat: true,
        image: true, // Bây giờ sẽ có image data
      }
    });

    console.log('Final message imageId:', finalMessage?.imageId);


    return {
      message: finalMessage,
      updatedChat
    };
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
      },
      include: {
        sender: true,
        chat: true
      }
    });
  };

  async editMessage(data: { messageId: number; userId: number; newContent?: string; newImage?: string }) {
    const { messageId, userId, newContent, newImage } = data;
  
    const message = await Message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        deletedAt: null
      },
      include: {
        image: true
      }
    });
  
    if (!message) {
      throw new Error('Message not found or not editable by this user');
    }
  
    if (!newContent && !newImage) {
      throw new Error('No new content or image provided for editing');
    }
  
    return await prisma.$transaction(async (tx) => {
      let imageId = message.imageId;

      if (newImage) {
        if (message.imageId) {
          await tx.image.delete({
            where: { id: message.imageId }
          });
        }
  
        const newImageRecord = await tx.image.create({
          data: {
            url: newImage,
            key: `user_${userId}_${Date.now()}`
          }
        });
  
        imageId = newImageRecord.id;
      }
      // Update the message
      const updatedMessage = await tx.message.update({
        where: { id: messageId },
        data: {
          content: newContent || message.content,
          imageId: imageId,
          isEdited: true
        },
        include: {
          sender: true,
          chat: true,
          image: true
        }
      });

      // Check if this is the last message in the chat
      const lastMessage = await tx.message.findFirst({
        where: {
          chatId: message.chatId,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // If this is the last message, update the chat's lastMessage
      if (lastMessage?.id === messageId) {
        await tx.chat.update({
          where: { id: message.chatId },
          data: {
            lastMessage: newContent || message.content || 'Send an image'
          }
        });
      }

      return updatedMessage;
    });
  }
}


