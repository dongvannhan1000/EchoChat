import { Router } from 'express';
import passport from '../config/passport';
import {
  handleOAuthCallback,
  linkGoogle,
  unlinkGoogle,
  linkFacebook,
  unlinkFacebook,
} from '../controllers/oauthController';

const router = Router();

// Google OAuth
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  handleOAuthCallback
);

// Facebook OAuth
router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login?error=oauth_failed' }),
  handleOAuthCallback
);

// Link/Unlink (protected with JWT)
router.post('/auth/link/google',
  passport.authenticate('jwt', { session: false }),
  linkGoogle
);

router.post('/auth/unlink/google',
  passport.authenticate('jwt', { session: false }),
  unlinkGoogle
);

router.post('/auth/link/facebook',
  passport.authenticate('jwt', { session: false }),
  linkFacebook
);

router.post('/auth/unlink/facebook',
  passport.authenticate('jwt', { session: false }),
  unlinkFacebook
);

export default router;
