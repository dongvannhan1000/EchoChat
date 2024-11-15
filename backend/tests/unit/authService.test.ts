// tests/unit/authService.test.ts
import * as authService from '../../src/services/authService';
import { User } from '../../src/models/prisma';
import bcrypt from 'bcryptjs';

jest.mock('../../src/models/prisma', () => ({
  User: {
    create: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should hash password and create user', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (User.create as jest.Mock).mockResolvedValue({
        ...mockUserData,
        id: 1,
        password: hashedPassword,
      });

      const result = await authService.register(mockUserData);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, 10);
      expect(User.create).toHaveBeenCalledWith({
        data: {
          ...mockUserData,
          password: hashedPassword,
        },
      });
      expect(result).toHaveProperty('id');
    });

    it('should throw error if user creation fails', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      (User.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.register(mockUserData)).rejects.toThrow('Database error');
    });
  });
});