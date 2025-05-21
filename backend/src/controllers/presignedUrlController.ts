import { Request, Response } from 'express';
import { presignedUrlService} from '../services/presignedUrlService';


export const generateUserAvatarUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(400).json({ message: 'Valid image content type is required' });
      return;
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      res.status(400).json({ message: 'File size exceeds the 5MB limit' });
      return;
    }

    const urlData = await presignedUrlService.generateAvatarPresignedUrl(userId, contentType);
    res.status(200).json(urlData);
  } catch (error: any) {
    console.error('Error generating presigned URL for user avatar:', error);
    res.status(500).json({ 
      message: 'Failed to generate upload URL', 
      error: error.message 
    });
  }
};

export const generateChatAvatarUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      res.status(400).json({ message: 'Invalid chat ID' });
      return;
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(400).json({ message: 'Valid image content type is required' });
      return;
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      res.status(400).json({ message: 'File size exceeds the 5MB limit' });
      return;
    }

    const urlData = await presignedUrlService.generateChatAvatarPresignedUrl(chatId, userId, contentType);
    res.status(200).json(urlData);
  } catch (error: any) {
    console.error('Error generating presigned URL for chat avatar:', error);
    const status = error.message.includes('not found') || error.message.includes('not a participant') ? 404 : 500;
    res.status(status).json({ 
      message: 'Failed to generate upload URL', 
      error: error.message 
    });
  }
};

export const generateMessageImageUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      res.status(400).json({ message: 'Invalid chat ID' });
      return;
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      res.status(400).json({ message: 'Valid image content type is required' });
      return;
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      res.status(400).json({ message: 'File size exceeds the 5MB limit' });
      return;
    }

    const urlData = await presignedUrlService.generateMessageImagePresignedUrl(chatId, userId, contentType);
    res.status(200).json(urlData);
  } catch (error: any) {
    console.error('Error generating presigned URL for message image:', error);
    const status = error.message.includes('not found') || error.message.includes('not a participant') ? 404 : 500;
    res.status(status).json({ 
      message: 'Failed to generate upload URL', 
      error: error.message 
    });
  }
};

export const confirmUpload = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { fileKey, type, messageId } = req.body;
    
    if (!fileKey || !type) {
      res.status(400).json({ message: 'File key and type are required' });
      return;
    }

    if (!['user', 'chat', 'message'].includes(type)) {
      res.status(400).json({ message: 'Invalid type. Must be user, chat, or message' });
      return;
    }

    if (type === 'message' && !messageId) {
      res.status(400).json({ message: 'Message ID is required for message image uploads' });
      return;
    }

    const result = await presignedUrlService.confirmUpload(
      fileKey, 
      type as 'user' | 'chat' | 'message', 
      messageId ? parseInt(messageId) : undefined
    );
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ 
      message: 'Failed to confirm upload', 
      error: error.message 
    });
  }
};