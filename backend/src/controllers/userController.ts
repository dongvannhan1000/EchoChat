import { Request, Response } from 'express';
import { User } from '../models/prisma';
import { AuthenticatedRequest } from 'middleware/authMiddleware';
import { UserService } from '../services/userService';

const userService = new UserService();

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findUnique({
      where: { id: Number(id) }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, avatar, statusMessage } = req.body;

  try {
    const updatedUser = await User.update({
      where: { id: Number(id) },
      data: { name, avatar, statusMessage }
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await User.delete({
      where: { id: Number(id) }
    });

    res.status(204).send(); // No content, indicating successful deletion
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete user' });
  }
};


export const getUsers = async (req: Request, res: Response) => {
  const { search } = req.query;

  try {
    const users = await User.findMany({
      where: search
        ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ]
        }
        : {},
      take: 10, 
      orderBy: {
        createdAt: 'desc' 
      } 
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve users' });
  }
};

export const blockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { userId: targetUserId } = req.body;
    const userId = req.user.id;
    if (userId === targetUserId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }
    const updatedUser = await userService.blockUser(userId, targetUserId);
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to block user' });
    }
  }
};

export const unblockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { userId: targetUserId } = req.body;
    const userId = req.user.id;
    const updatedUser = await userService.unblockUser(userId, targetUserId);
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to unblock user' });
    }
  }
};

export const updateStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { statusMessage } = req.body;
    const userId = req.user.id;
    const updatedUser = await userService.updateStatus(userId, statusMessage);
    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to update status user' });
    }
  }
};
