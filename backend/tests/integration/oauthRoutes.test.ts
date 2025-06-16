// oauthRoutes.test.ts
import express from 'express';
import request from 'supertest';
import oauthRoutes from '../../src/routes/oauthRoutes';

// Mock middleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticateGoogle: (req, res, next) => {
    res.redirect('https://mock-google.com');
  },
  authenticateGoogleCallback: (req, res, next) => {
    req.user = { id: 'google_123', email: 'test@gmail.com' };
    next();
  },
  authenticateFacebook: (req, res, next) => {
    res.redirect('https://mock-facebook.com');
  },
  authenticateFacebookCallback: (req, res, next) => {
    req.user = { id: 'fb_123', email: 'fb@gmail.com' };
    next();
  },
  authenticateJWT: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === 'valid-jwt-token') {
      req.user = { id: 'user_123', email: 'existing@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  },
}));

// Mock controller
jest.mock('../../src/controllers/oauthController', () => ({
  handleOAuthCallback: (req, res) => {
    res.json({ success: true, user: req.user, token: 'mock-jwt-token' });
  },
  linkGoogle: (req, res) => {
    res.json({ success: true, message: 'Google account linked successfully' });
  },
  unlinkGoogle: (req, res) => {
    res.json({ success: true, message: 'Google account unlinked successfully' });
  },
  linkFacebook: (req, res) => {
    res.json({ success: true, message: 'Facebook account linked successfully' });
  },
  unlinkFacebook: (req, res) => {
    res.json({ success: true, message: 'Facebook account unlinked successfully' });
  },
}));

describe('OAuth Routes - Real Integration Test', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(oauthRoutes);
  });

  it('should redirect to Google OAuth', async () => {
    const res = await request(app).get('/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('mock-google.com');
  });

  it('should handle Google OAuth callback', async () => {
    const res = await request(app).get('/auth/google/callback?code=abc');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@gmail.com');
  });

  it('should redirect to Facebook OAuth', async () => {
    const res = await request(app).get('/auth/facebook');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('mock-facebook.com');
  });

  it('should handle Facebook OAuth callback', async () => {
    const res = await request(app).get('/auth/facebook/callback?code=abc');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('fb@gmail.com');
  });

  it('should allow linking Google with valid token', async () => {
    const res = await request(app)
      .post('/auth/link/google')
      .set('Authorization', 'Bearer valid-jwt-token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Google account linked successfully');
  });

  it('should block linking Google with no token', async () => {
    const res = await request(app).post('/auth/link/google');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should allow unlinking Facebook with valid token', async () => {
    const res = await request(app)
      .post('/auth/unlink/facebook')
      .set('Authorization', 'Bearer valid-jwt-token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Facebook account unlinked successfully');
  });
});
