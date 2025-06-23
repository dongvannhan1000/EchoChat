import { Router } from 'express';
import passport from '../config/passport';
import {
  handleOAuthCallback,
  linkGoogle,
  unlinkGoogle,
  linkFacebook,
  unlinkFacebook,
} from '../controllers/oauthController';

import {
  authenticateGoogle,
  authenticateGoogleCallback,
  authenticateFacebook,
  authenticateFacebookCallback,
  authenticateJWT
} from '../middleware/authMiddleware';

const router = Router();

// Google OAuth
router.get('/auth/google', authenticateGoogle);
router.get('/auth/google/callback', authenticateGoogleCallback, handleOAuthCallback);

// Facebook OAuth
router.get('/auth/facebook', authenticateFacebook);
router.get('/auth/facebook/callback', authenticateFacebookCallback, handleOAuthCallback);

// Link/Unlink (protected with JWT)
router.post('/auth/link/google', authenticateJWT, linkGoogle);
router.post('/auth/unlink/google', authenticateJWT, unlinkGoogle);
router.post('/auth/link/facebook', authenticateJWT, linkFacebook);
router.post('/auth/unlink/facebook', authenticateJWT, unlinkFacebook);

export default router;
