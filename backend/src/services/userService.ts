import { User } from '../models/prisma';
import bcrypt from 'bcryptjs';

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

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      console.log('Changing password for user:', { userId });
      
      const user = await User.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          password: true 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      const updatedUser = await User.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword
        },
        select: {
          id: true,
          email: true,
          updatedAt: true
        }
      });

      console.log('Password changed successfully for user:', updatedUser.id);
      return {
        success: true,
        message: 'Password changed successfully',
        user: updatedUser
      };

    } catch (error) {
      console.error('Error in changePassword:', error);
      throw error;
    }
  }
}