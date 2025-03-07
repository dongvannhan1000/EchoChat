import bcrypt from 'bcryptjs';
import { User } from '../models/prisma';

export const register = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await User.create({
    data: { name, email, password: hashedPassword }
  });
};

export const getUserById = async (id: number) => {
  return await User.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      statusMessage: true,
      lastSeen: true,
      block: true
    }
  });
};