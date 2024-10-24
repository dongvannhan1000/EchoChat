import bcrypt from 'bcryptjs';
import { User } from '../models/prisma';

export const register = async ({ name, email, password }: { name: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    data: { name, email, password: hashedPassword }
  });
};