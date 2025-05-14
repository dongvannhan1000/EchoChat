import { Request, Response } from 'express';
import { PresignedUrlService } from '../services/presignedUrlService';

const presignedUrlService = new PresignedUrlService();

export const generateUserAvatarUrl = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Valid image content type is required' });
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
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
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Valid image content type is required' });
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
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
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    const contentType = req.body.contentType;
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Valid image content type is required' });
    }

    // Check file size limit (from Content-Length header if available)
    const contentLength = parseInt(req.get('Content-Length') || '0');
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (contentLength > 0 && contentLength > maxSize) {
      return res.status(400).json({ message: 'File size exceeds the 5MB limit' });
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
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { fileKey, type, messageId } = req.body;
    
    if (!fileKey || !type) {
      return res.status(400).json({ message: 'File key and type are required' });
    }

    if (!['user', 'chat', 'message'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be user, chat, or message' });
    }

    if (type === 'message' && !messageId) {
      return res.status(400).json({ message: 'Message ID is required for message image uploads' });
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