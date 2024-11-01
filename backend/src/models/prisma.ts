import { PrismaClient, ChatType, ChatRole } from '@prisma/client';

const prisma = new PrismaClient();

const User = prisma.user;

const UserChat = prisma.userChat;

const Chat = prisma.chat;

const Message = prisma.message;


export { User, UserChat, Chat, Message, prisma };