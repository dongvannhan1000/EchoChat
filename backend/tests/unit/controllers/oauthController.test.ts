import { Request, Response } from 'express';
import * as controller from '../../../src/controllers/oauthController';
import { linkGoogleAccount, unlinkGoogleAccount, linkFacebookAccount, unlinkFacebookAccount } from '../../../src/services/oauthService';
import { generateTokens } from '../../../src/config/token';

// Mock services
jest.mock('../../../src/services/oauthService', () => ({
  linkGoogleAccount: jest.fn(),
  unlinkGoogleAccount: jest.fn(),
  linkFacebookAccount: jest.fn(),
  unlinkFacebookAccount: jest.fn()
}));

jest.mock('../../../src/config/token', () => ({
  generateTokens: jest.fn()
}));

// Mock environment variables
const mockProcessEnv = {
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://example.com'
};

describe('OAuthController', () => {
  let mockReq: Partial<Request & { user?: any }>;
  let mockRes: Partial<Response>;
  
  beforeEach(() => {
    mockReq = {
      user: { 
        id: 1, 
        googleId: 'google-123', 
        facebookId: 'facebook-456' 
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn()
    };
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.env
    process.env = { ...process.env, ...mockProcessEnv };
  });
  
  afterEach(() => {
    // Restore original process.env
    jest.restoreAllMocks();
  });
  
  describe('handleOAuthCallback', () => {
    it('should generate tokens and redirect to frontend on success', async () => {
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456'
      };
      
      (generateTokens as jest.Mock).mockReturnValue(mockTokens);
      
      await controller.handleOAuthCallback(mockReq as Request, mockRes as Response);
      
      expect(generateTokens).toHaveBeenCalledWith(1);
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token-456', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com/auth/callback?token=access-token-123');
    });
    
    it('should set secure cookie to false in development environment', async () => {
      process.env.NODE_ENV = 'development';
      
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456'
      };
      
      (generateTokens as jest.Mock).mockReturnValue(mockTokens);
      
      await controller.handleOAuthCallback(mockReq as Request, mockRes as Response);
      
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token-456', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    });
    
    it('should redirect to login with error on failure', async () => {
      const error = new Error('Token generation failed');
      (generateTokens as jest.Mock).mockImplementation(() => {
        throw error;
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await controller.handleOAuthCallback(mockReq as Request, mockRes as Response);
      
      expect(consoleSpy).toHaveBeenCalledWith('OAuth callback error:', error);
      expect(mockRes.redirect).toHaveBeenCalledWith('/login?error=oauth_callback_failed');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('linkGoogle', () => {
    it('should link Google account successfully', async () => {
      (linkGoogleAccount as jest.Mock).mockResolvedValue(undefined);
      
      await controller.linkGoogle(mockReq as Request, mockRes as Response);
      
      expect(linkGoogleAccount).toHaveBeenCalledWith(1, 'google-123');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Google account linked successfully' });
    });
    
    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (linkGoogleAccount as jest.Mock).mockRejectedValue(error);
      
      await controller.linkGoogle(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to link Google account' });
    });
  });
  
  describe('unlinkGoogle', () => {
    it('should unlink Google account successfully', async () => {
      (unlinkGoogleAccount as jest.Mock).mockResolvedValue(undefined);
      
      await controller.unlinkGoogle(mockReq as Request, mockRes as Response);
      
      expect(unlinkGoogleAccount).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Google account unlinked successfully' });
    });
    
    it('should handle service errors', async () => {
      const error = new Error('Database error');
      (unlinkGoogleAccount as jest.Mock).mockRejectedValue(error);
      
      await controller.unlinkGoogle(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to unlink Google account' });
    });
  });
  
  describe('linkFacebook', () => {
    it('should link Facebook account successfully', async () => {
      (linkFacebookAccount as jest.Mock).mockResolvedValue(undefined);
      
      await controller.linkFacebook(mockReq as Request, mockRes as Response);
      
      expect(linkFacebookAccount).toHaveBeenCalledWith(1, 'facebook-456');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Facebook account linked successfully' });
    });
    
    it('should handle service errors', async () => {
      const error = new Error('Facebook API error');
      (linkFacebookAccount as jest.Mock).mockRejectedValue(error);
      
      await controller.linkFacebook(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to link Facebook account' });
    });
  });
  
  describe('unlinkFacebook', () => {
    it('should unlink Facebook account successfully', async () => {
      (unlinkFacebookAccount as jest.Mock).mockResolvedValue(undefined);
      
      await controller.unlinkFacebook(mockReq as Request, mockRes as Response);
      
      expect(unlinkFacebookAccount).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Facebook account unlinked successfully' });
    });
    
    it('should handle service errors', async () => {
      const error = new Error('Facebook API error');
      (unlinkFacebookAccount as jest.Mock).mockRejectedValue(error);
      
      await controller.unlinkFacebook(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to unlink Facebook account' });
    });
  });
});