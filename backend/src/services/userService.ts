import { User } from '../models/prisma';

export class UserService {
  async blockUser(userId: number, targetUserId: number) {
    const user = await User.findUnique({
      where: { id: userId },
      select: { block: true }
    });
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await User.update({
      where: { id: userId },
      data: {
        block: {
          set: [...(user.block || []), targetUserId].filter((id, index, self) => 
            self.indexOf(id) === index
          )
        }
      }
    });
    return updatedUser;
  }
  async unblockUser(userId: number, targetUserId: number) {
    const user = await User.findUnique({
      where: { id: userId },
      select: { block: true }
    });
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await User.update({
      where: { id: userId },
      data: {
        block: {
          set: (user.block || []).filter(id => id !== targetUserId)
        }
      }
    });
    return updatedUser;
  }
}