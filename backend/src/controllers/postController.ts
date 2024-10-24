import { Request, Response } from 'express';
import { Post } from '../models/prisma';

export const createPost = async (req: Request, res: Response) => {
  const { title, content, authorId } = req.body;

  try {
    const newPost = await Post.create({
      data: {
        title,
        content,
        authorId
      }
    });
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create post' });
  }
};

export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Post.findUnique({
      where: { id }
    });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve post' });
  }
};

export const editPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const updatedPost = await Post.update({
      where: { id },
      data: { title, content }
    });
    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: 'Unable to update post' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await Post.delete({ where: { id } });
    res.status(204).send(); // No Content
  } catch (error) {
    res.status(500).json({ error: 'Unable to delete post' });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.findMany();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve posts' });
  }
};