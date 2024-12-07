import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from 'middleware/authMiddleware';
import { ChatService } from '../services/chatService';

const chatService = new ChatService();

export const getUserChats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const chats = await chatService.getUserChats(userId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chats' });
  }
};

export const createChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { chatType, participantIds } = req.body;
    if (!['group', 'private'].includes(chatType) || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    const userId = req.user.id;
    const chat = await chatService.createChat(userId, req.body);
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat' });
  }
};

export const getChatDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);
    const chat = await chatService.getChatDetails(chatId, userId);
    res.json(chat);
  } catch (error) {
    res.status(404).json({ message: 'Chat not found' });
  }
};

export const leaveChat = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId);

    await chatService.leaveChat(chatId, userId);
    res.json({ message: 'Successfully left chat' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to leave chat' });
    }
  }
};

export const markChatStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    console.log('Request Params:', req.params);
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updatedUserChat = await chatService.markChatStatus(
      parseInt(id)
    );

    res.json(updatedUserChat);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to change status chat' });
    }
  }
};

// export const pinChat = async (req:AuthenticatedRequest, res: Response, next: NextFunction) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
//   }
// };