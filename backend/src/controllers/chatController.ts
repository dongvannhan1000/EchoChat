import { Response } from "express";
import { AuthenticatedRequest } from "middleware/authMiddleware";
import { ChatService } from "services/chatService";

const chatService = new ChatService();

export class ChatController {
  async getUserChats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id; // Assuming user is attached by auth middleware
      const chats = await chatService.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get chats' });
    }
  }

  async createChat(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const chat = await chatService.createChat(userId, req.body);
      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create chat' });
    }
  }

  async getChatDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const chatId = parseInt(req.params.chatId);
      const chat = await chatService.getChatDetails(chatId, userId);
      res.json(chat);
    } catch (error) {
      res.status(404).json({ message: 'Chat not found' });
    }
  }

  async leaveChat(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
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
  }
}