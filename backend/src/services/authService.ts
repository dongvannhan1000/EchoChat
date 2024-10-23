import bcrypt from 'bcryptjs';
import { User } from '../models/user';

export const register = async ({ username, email, password }: { username: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    data: { username, email, password: hashedPassword }
  });
};