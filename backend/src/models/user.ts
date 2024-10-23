import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const User = prisma.user;

const Post = prisma.post;

const Comment = prisma.comment;

export { User, Post, Comment };