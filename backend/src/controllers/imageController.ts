import { Request, Response } from 'express';
import { ImageService } from '../services/imageService';

const imageService = new ImageService();

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageMetadata = await imageService.uploadImage(file);
    res.status(201).json(imageMetadata);
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload image', error });
  }
};