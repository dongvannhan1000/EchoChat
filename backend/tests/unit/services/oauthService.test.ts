import { unlinkGoogleAccount, unlinkFacebookAccount, linkGoogleAccount, linkFacebookAccount } from '../../../src/services/oauthService';
import { prisma } from '../../../src/models/prisma';

// Mock imports
jest.mock('../../../src/models/prisma', () => require('../../../__mocks__/prisma'));

describe('OAuthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('unlinkGoogleAccount', () => {
    it('should unlink Google account from user', async () => {
      // Mock prisma user update
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: null,
        facebookId: 'facebook123'
      });

      const result = await unlinkGoogleAccount(1);

      // Check the result
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('googleId', null);

      // Verify database calls
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { googleId: null }
      });
    });

    it('should handle user not found during unlink', async () => {
      // Mock user not found error
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(unlinkGoogleAccount(999))
        .rejects.toThrow('User not found');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { googleId: null }
      });
    });
  });

  describe('unlinkFacebookAccount', () => {
    it('should unlink Facebook account from user', async () => {
      // Mock prisma user update
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: 'google123',
        facebookId: null
      });

      const result = await unlinkFacebookAccount(1);

      // Check the result
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('facebookId', null);

      // Verify database calls
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { facebookId: null }
      });
    });

    it('should handle user not found during unlink', async () => {
      // Mock user not found error
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(unlinkFacebookAccount(999))
        .rejects.toThrow('User not found');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { facebookId: null }
      });
    });
  });

  describe('linkGoogleAccount', () => {
    it('should link Google account to user', async () => {
      const googleId = 'google123456789';
      
      // Mock prisma user update
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: googleId,
        facebookId: null
      });

      const result = await linkGoogleAccount(1, googleId);

      // Check the result
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('googleId', googleId);

      // Verify database calls
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { googleId }
      });
    });

    it('should handle user not found during link', async () => {
      const googleId = 'google123456789';
      
      // Mock user not found error
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(linkGoogleAccount(999, googleId))
        .rejects.toThrow('User not found');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { googleId }
      });
    });

    it('should handle duplicate Google account linking', async () => {
      const googleId = 'google123456789';
      
      // Mock unique constraint violation
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'));

      await expect(linkGoogleAccount(1, googleId))
        .rejects.toThrow('Unique constraint failed');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { googleId }
      });
    });
  });

  describe('linkFacebookAccount', () => {
    it('should link Facebook account to user', async () => {
      const facebookId = 'facebook123456789';
      
      // Mock prisma user update
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: null,
        facebookId: facebookId
      });

      const result = await linkFacebookAccount(1, facebookId);

      // Check the result
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('facebookId', facebookId);

      // Verify database calls
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { facebookId }
      });
    });

    it('should handle user not found during link', async () => {
      const facebookId = 'facebook123456789';
      
      // Mock user not found error
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(linkFacebookAccount(999, facebookId))
        .rejects.toThrow('User not found');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { facebookId }
      });
    });

    it('should handle duplicate Facebook account linking', async () => {
      const facebookId = 'facebook123456789';
      
      // Mock unique constraint violation
      (prisma.user.update as jest.Mock).mockRejectedValue(new Error('Unique constraint failed'));

      await expect(linkFacebookAccount(1, facebookId))
        .rejects.toThrow('Unique constraint failed');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { facebookId }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle linking when user already has both accounts', async () => {
      const newGoogleId = 'newgoogle123';
      
      // Mock user with existing accounts
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: newGoogleId,
        facebookId: 'existingfacebook123'
      });

      const result = await linkGoogleAccount(1, newGoogleId);

      expect(result).toHaveProperty('googleId', newGoogleId);
      expect(result).toHaveProperty('facebookId', 'existingfacebook123');
    });

    it('should handle unlinking when user has no linked accounts', async () => {
      // Mock user with no linked accounts
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test User',
        googleId: null,
        facebookId: null
      });

      const result = await unlinkGoogleAccount(1);

      expect(result).toHaveProperty('googleId', null);
      expect(result).toHaveProperty('facebookId', null);
    });
  });
});