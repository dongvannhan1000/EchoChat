import { User } from '../models/prisma';

export class UserService {
  async blockUser(userId: number, targetUserId: number) {
    try {
      console.log('Blocking user:', { userId, targetUserId });
      
      const updatedUser = await User.update({
        where: { id: userId },
        data: {
          block: {
            push: targetUserId  // Sử dụng push thay vì set để thêm vào mảng
          }
        },
        select: {
          id: true,
          block: true  // Select block array để kiểm tra
        }
      });
      
      console.log('Updated user block list:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error in blockUser:', error);
      throw error;
    }
  }

  async unblockUser(userId: number, targetUserId: number) {
    try {
      console.log('Unblocking user:', { userId, targetUserId });
      
      const user = await User.findUnique({
        where: { id: userId },
        select: { block: true }
      });
      const updatedUser = await User.update({
        where: { id: userId },
        data: {
          block: {
            set: (user?.block || []).filter(id => id !== targetUserId)
          }
        },
        select: {
          id: true,
          block: true
        }
      });
      
      console.log('Updated user block list:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error in unblockUser:', error);
      throw error;
    }
  }

  async updateStatus(userId: number, statusMessage: string) {
    try {
      console.log('Update status:', { userId });
      
      const user = await User.findUnique({
        where: { id: userId },
        select: { statusMessage: true }
      });
      const updatedUser = await User.update({
        where: { id: userId },
        data: {
          statusMessage: statusMessage
        },
        select: {
          id: true,
          statusMessage: true
        }
      });
      
      console.log('Updated user status', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw error;
    }
  }
}