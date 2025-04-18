import { Request, Response } from 'express';
import { ImageService } from '../services/imageService';
import { AuthenticatedRequest } from 'middleware/authMiddleware';

const imageService = new ImageService();

export const uploadUserAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const imageMetadata = await imageService.uploadImage(file, userId);
    res.status(201).json(imageMetadata);
  } catch (error: any) {
    console.error('Error when uploading user avatar:', error);
    res.status(500).json({ 
      message: 'Cannot upload user avatar', 
      error: error.message 
    });
  }
};

export const uploadChatAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const chatId = req.body.chatId ? parseInt(req.body.chatId) : undefined;
    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // TODO: Kiểm tra người dùng có quyền thay đổi avatar của chat không
    // Ví dụ: chỉ admin của chat mới có quyền thay đổi avatar

    const imageMetadata = await imageService.uploadImage(file, undefined, chatId);
    res.status(201).json(imageMetadata);
  } catch (error: any) {
    console.error('Error when uploading chat avatar:', error);
    res.status(500).json({ 
      message: 'Cannot upload chat avatar', 
      error: error.message 
    });
  }
};

export const uploadMessageImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const messageId = req.body.messageId ? parseInt(req.body.messageId) : undefined;
    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    // TODO: Kiểm tra người dùng có phải là người gửi tin nhắn không
    // Chỉ người gửi tin nhắn mới có quyền đính kèm ảnh

    const imageMetadata = await imageService.uploadImage(file, undefined, undefined, messageId);
    res.status(201).json(imageMetadata);
  } catch (error: any) {
    console.error('Error when uploading message image:', error);
    res.status(500).json({ 
      message: 'Cannot upload message image', 
      error: error.message 
    });
  }
};

export const getUserAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const image = await imageService.getImage('user', userId);
    if (!image) {
      return res.status(404).json({ message: 'User has no avatar' });
    }
    
    res.status(200).json(image);
  } catch (error: any) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({
      message: 'Failed to fetch user avatar',
      error: error.message
    });
  }
};

export const getChatAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    
    // TODO: Kiểm tra người dùng có phải là thành viên của chat không
    
    const image = await imageService.getImage('chat', chatId);
    if (!image) {
      return res.status(404).json({ message: 'Chat has no avatar' });
    }
    
    res.status(200).json(image);
  } catch (error: any) {
    console.error('Error fetching chat avatar:', error);
    res.status(500).json({
      message: 'Failed to fetch chat avatar',
      error: error.message
    });
  }
};

export const getMessageImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    // TODO: Kiểm tra người dùng có quyền xem tin nhắn này không
    
    const image = await imageService.getImage('message', messageId);
    if (!image) {
      return res.status(404).json({ message: 'Message has no image' });
    }
    
    res.status(200).json(image);
  } catch (error: any) {
    console.error('Error fetching message image:', error);
    res.status(500).json({
      message: 'Failed to fetch message image',
      error: error.message
    });
  }
};

export const deleteUserAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    await imageService.deleteImage('user', userId);
    res.status(200).json({ message: 'User avatar deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user avatar:', error);
    res.status(error.message === 'Image not found' ? 404 : 500).json({
      message: error.message || 'Failed to delete user avatar',
    });
  }
};

export const deleteChatAvatar = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    
    // TODO: Kiểm tra người dùng có quyền xóa avatar của chat không
    
    await imageService.deleteImage('chat', chatId);
    res.status(200).json({ message: 'Chat avatar deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting chat avatar:', error);
    res.status(error.message === 'Image not found' ? 404 : 500).json({
      message: error.message || 'Failed to delete chat avatar',
    });
  }
};

export const deleteMessageImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    // TODO: Kiểm tra người dùng có phải là người gửi tin nhắn không
    
    await imageService.deleteImage('message', messageId);
    res.status(200).json({ message: 'Message image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting message image:', error);
    res.status(error.message === 'Image not found' ? 404 : 500).json({
      message: error.message || 'Failed to delete message image',
    });
  }
};