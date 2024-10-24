import { Request, Response } from 'express';
import { Comment } from '../models/prisma';

export const createComment = async (req: Request, res: Response) => {
  const { postId, content } = req.body;
  const userId = (req.user as { id: string }).id;

  try {
    const newComment = await Comment.create({
      data: {
        postId,
        userId,
        content,
        username: (req.user as { id: string; username?: string }).username || 'Anonymous'
      }
    });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create comment' });
  }
};

export const editComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const updatedComment = await Comment.update({
      where: { id },
      data: { content }
    });
    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update comment' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await Comment.delete({ where: { id } });
    res.status(204).send(); // No Content
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete comment' });
  }
};