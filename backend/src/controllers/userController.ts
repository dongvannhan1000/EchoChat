import { Request, Response } from 'express';
import { User } from '../models/prisma';

export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findUnique({
      where: { id: Number(id) }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve user' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, profilePic } = req.body;

  try {
    const updatedUser = await User.update({
      where: { id: Number(id) },
      data: { name, profilePic }
    });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update post' });
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
      where: {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      }
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve users' });
  }
};

