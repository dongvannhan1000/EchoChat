import { Response } from "express";
import { AuthenticatedRequest } from "middleware/authMiddleware";
import { MessageService } from "services/messageService";

const messageService = new MessageService();

export class MessageController {
  async getChatMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const chatId = parseInt(req.params.chatId);
      const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const messages = await messageService.getChatMessages(chatId, userId, cursor, limit);
      res.json(messages);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const chatId = parseInt(req.params.chatId);
      const message = await messageService.sendMessage({
        ...req.body,
        chatId,
        senderId: userId
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const messageId = parseInt(req.params.messageId);
      await messageService.deleteMessage(messageId, userId);
      res.json({ message: 'Message deleted' });
    }  catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to delete message' });
      }
    }
  }
}