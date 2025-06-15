import { generateTokens } from "../config/token";
import { Request, Response } from "express";
import { linkGoogleAccount, unlinkGoogleAccount, linkFacebookAccount, unlinkFacebookAccount } from "../services/oauthService";
import { AppUser } from "../types/user";

export const handleOAuthCallback = async (req: Request, res: Response) => {
    try {
      const user = req.user as AppUser;
      const { accessToken, refreshToken } = generateTokens(user.id);
  
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
  
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=oauth_callback_failed');
    }
  };

  export const linkGoogle = async (req: Request, res: Response) => {
    try {
      const user = req.user as AppUser;
      await linkGoogleAccount(user.id, user.googleId!);
      res.json({ message: 'Google account linked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to link Google account' });
    }
  };
  
  export const unlinkGoogle = async (req: Request, res: Response) => {
    try {
      const user = req.user as AppUser;
      await unlinkGoogleAccount(user.id);
      res.json({ message: 'Google account unlinked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unlink Google account' });
    }
  };
  
  export const linkFacebook = async (req: Request, res: Response) => {
    try {
      const user = req.user as AppUser;
      await linkFacebookAccount(user.id, user.facebookId!);
      res.json({ message: 'Facebook account linked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to link Facebook account' });
    }
  };
  
  export const unlinkFacebook = async (req: Request, res: Response) => {
    try {
      const user = req.user as AppUser;
      await unlinkFacebookAccount(user.id);
      res.json({ message: 'Facebook account unlinked successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unlink Facebook account' });
    }
  };
  