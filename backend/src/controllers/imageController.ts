import { Request, Response } from 'express';
import { ImageService } from '../services/imageService';
import { prisma } from 'models/prisma';

const imageService = new ImageService();

export const uploadUserAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
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

export const uploadChatAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const chatId = req.body.chatId ? parseInt(req.body.chatId) : undefined;
    if (!chatId) {
      res.status(400).json({ message: 'Chat ID is required' });
      return;
    }

    // Check user has permission to change chat avatar
    // const userChat = await prisma.userChat.findUnique({
    //   where: {
    //     id: chatId,
    //     userId: req.user?.id,
    //   },
    // });
    // if (!userChat) {
    //   res.status(401).json({ message: 'User not authorized to change chat avatar' });
    //   return;
    // }
    
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

export const uploadMessageImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const messageId = req.body.messageId ? parseInt(req.body.messageId) : undefined;
    if (!messageId) {
      res.status(400).json({ message: 'Message ID is required' });
      return;
    }

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

export const getUserAvatar = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const image = await imageService.getImage('user', userId);
    if (!image) {
      res.status(404).json({ message: 'User has no avatar' });
      return;
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

export const getChatAvatar = async (req: Request, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    
    const image = await imageService.getImage('chat', chatId);
    if (!image) {
      res.status(404).json({ message: 'Chat has no avatar' });
      return;
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

export const getMessageImage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    const image = await imageService.getImage('message', messageId);
    if (!image) {
      res.status(404).json({ message: 'Message has no image' });
      return;
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

export const deleteUserAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
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

export const deleteChatAvatar = async (req: Request, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    
    // Check user has permission to delete chat avatar
    
    await imageService.deleteImage('chat', chatId);
    res.status(200).json({ message: 'Chat avatar deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting chat avatar:', error);
    res.status(error.message === 'Image not found' ? 404 : 500).json({
      message: error.message || 'Failed to delete chat avatar',
    });
  }
};

export const deleteMessageImage = async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    // Check user has permission to delete message image
    
    await imageService.deleteImage('message', messageId);
    res.status(200).json({ message: 'Message image deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting message image:', error);
    res.status(error.message === 'Image not found' ? 404 : 500).json({
      message: error.message || 'Failed to delete message image',
    });
  }
};