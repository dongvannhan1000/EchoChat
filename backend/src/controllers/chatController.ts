import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Conversations
export const createConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await prisma.conversation.create({
      data: {},
    });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const getConversations = async (_: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany();
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(id) },
      include: { participants: true, messages: true },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
};

export const updateConversation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedConversation = await prisma.conversation.update({
      where: { id: Number(id) },
      data: req.body,
    });
    res.status(200).json(updatedConversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.conversation.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

// Participants
export const addParticipant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const participant = await prisma.participant.create({
      data: {
        userId,
        conversationId: Number(id),
      },
    });
    res.status(201).json(participant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add participant' });
  }
};

export const deleteParticipant = async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  try {
    await prisma.participant.delete({
      where: {
        userId_conversationId: {
          userId: Number(userId),
          conversationId: Number(id),
        },
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete participant' });
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const participants = await prisma.participant.findMany({
      where: { conversationId: Number(id) },
      include: { user: true },
    });
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve participants' });
  }
};

// Messages
export const addMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, senderId } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        conversationId: Number(id),
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add message' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: Number(id) },
      include: { sender: true },
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

export const getMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const message = await prisma.message.findUnique({
      where: { id: Number(id) },
      include: { sender: true },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve message' });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.message.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
