import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';

const messageService = new MessageService();


export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const chatId = parseInt(req.params.chatId);
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const messages = await messageService.getChatMessages(chatId, userId, cursor, limit);
    res.json(messages);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to get messages.' });
    }
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const chatId = parseInt(req.params.chatId);
    const { content, imageFileKey, replyToId, type } = req.body;
    const message = await messageService.sendMessage({
      chatId,
      senderId: userId,
      type,
      content,
      imageFileKey,
      replyToId
    });
    res.status(201).json(message);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to send message.' });
    }
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.messageId);
    const updatedMessage = await messageService.deleteMessage(messageId, userId);
    res.status(200).json(updatedMessage);
  }  catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete message' });
    }
  }
};

export const editMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const messageId = Number(req.params.messageId);
    const { newContent, newImage } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!newContent && !newImage) {
      return res.status(400).json({ error: 'No new content or image provided' });
    }
    const updatedMessage = await messageService.editMessage({
      messageId,
      userId,
      newContent,
      newImage
    });
    res.status(200).json(updatedMessage);
  } catch (error: any) {
    console.error('Error editing message:', error.message);
    res.status(500).json({ error: error.message });
  }
};
