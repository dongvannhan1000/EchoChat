import express, { Express } from 'express';
import request from 'supertest';

const mockAuthenticateMiddleware = jest.fn();

jest.mock('../../src/controllers/oauthController', () => ({
  __esModule: true,
  handleOAuthCallback: jest.fn(),
  linkGoogle: jest.fn(),
  unlinkGoogle: jest.fn(),
  linkFacebook: jest.fn(),
  unlinkFacebook: jest.fn(),
}));

// Khi mock passport, chúng ta sẽ sử dụng tham chiếu ổn định đã tạo ở trên.
jest.mock('../../src/config/passport', () => ({
  __esModule: true,
  default: {
    // authenticate bây giờ là một hàm mock trả về mock middleware của chúng ta.
    // Cấu trúc này khớp với cách passport.authenticate(strategy, options) trả về một middleware.
    authenticate: jest.fn().mockReturnValue(mockAuthenticateMiddleware),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
  },
}));
describe('OAuth Routes', () => {
  let app: Express;

  
  
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    jest.resetModules();

    const controller = require('../../src/controllers/oauthController');
    const passport = require('../../src/config/passport').default;
    const mockAuthenticate = passport.authenticate as jest.Mock;
    mockAuthenticateMiddleware.mockImplementation((req, res, next) => {
      // Bạn có thể giả lập việc đăng nhập thành công bằng cách đính kèm một user vào request
      // req.user = { id: 123, email: 'test@example.com' };
      next();
    });

			controller.handleOAuthCallback.mockImplementation((req, res) => {
        console.log('controller.handleOAuthCallback mock called');
        res.status(200).json({ success: true, user: req.user });
      });
  
			const oauthRoutes = require('../../src/routes/oauthRoutes').default;

      app = express();
      app.use(express.json());
      app.use(oauthRoutes);
  
      // Store request for use in test
      (global as any).request = request;

  });
  
  describe('GET /auth/google', () => {
    it('should authenticate with Google OAuth', async () => {

      mockAuthenticateMiddleware.mockImplementation((req, res, next) => {
        res.redirect('https://accounts.google.com/o/oauth2/v2/auth');
      });

			const res = await request(app).get('/auth/google');

      const mockAuthenticate = require('../../src/config/passport').default.authenticate;


			expect(res.status).toBe(302);
			expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com/);
			expect(mockAuthenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'] });
    });
  });
  
  describe('GET /auth/google/callback', () => {
    it('should handle successful Google OAuth callback', async () => {

			const res = await request(app).get('/auth/google/callback');

			console.log('Response status:', res.status);
			console.log('Response body:', res.body);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
			// expect(res.body).toEqual({ success: true, user: { id: 123 } });
			expect(mockAuthenticate).toHaveBeenCalledWith('google', {
				failureRedirect: '/login?error=oauth_failed',
			});
    	expect(controller.handleOAuthCallback).toHaveBeenCalled();
    });
    
    it('should redirect to login on authentication failure', async () => {
      // Override mock to simulate failure
      (mockAuthenticate as jest.Mock).mockImplementation((strategy, options) => {
        return (req, res, next) => {
          res.redirect(options.failureRedirect);
        };
      });
      
      await request(app)
        .get('/auth/google/callback')
        .expect(302);
      
      expect(controller.handleOAuthCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /auth/facebook', () => {
    it('should authenticate with Facebook OAuth', async () => {
      // Override default mock for this test
      jest
      .spyOn(passport, 'authenticate')
      .mockImplementation((strategy, options) => {
        return (req, res, next) => {
          // Simulate redirect to Facebook OAuth
          res.redirect('https://www.facebook.com/v18.0/dialog/oauth');
        };
      });
      
      await request(app)
        .get('/auth/facebook')
        .expect(302); // Redirect to Facebook
      
      expect(mockAuthenticate).toHaveBeenCalledWith('facebook', { scope: ['email'] });
    });
  });
  
  describe('GET /auth/facebook/callback', () => {
    it('should handle successful Facebook OAuth callback', async () => {
      // Mock controller
      (controller.handleOAuthCallback as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, user: req.user });
      });
      
      await request(app)
        .get('/auth/facebook/callback')
        .expect(200);
      
      expect(mockAuthenticate).toHaveBeenCalledWith('facebook', { failureRedirect: '/login?error=oauth_failed' });
      expect(controller.handleOAuthCallback).toHaveBeenCalled();
    });
    
    it('should redirect to login on authentication failure', async () => {
      // Override mock to simulate failure
      (mockAuthenticate as jest.Mock).mockImplementation((strategy, options) => {
        return (req, res, next) => {
          res.redirect(options.failureRedirect);
        };
      });
      
      await request(app)
        .get('/auth/facebook/callback')
        .expect(302);
      
      expect(controller.handleOAuthCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/link/google', () => {
    it('should link Google account with JWT authentication', async () => {
      // Mock controller
      (controller.linkGoogle as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Google account linked' });
      });
      
      await request(app)
        .post('/auth/link/google')
        .send({ googleId: 'google123' })
        .expect(200);
      
      expect(mockAuthenticate).toHaveBeenCalledWith('jwt', { session: false });
      expect(controller.linkGoogle).toHaveBeenCalled();
    });
    
    it('should reject unauthenticated requests', async () => {
      // Override mock to simulate auth failure
      (mockAuthenticate as jest.Mock).mockImplementation((strategy, options) => {
        return (req, res, next) => {
          res.status(401).json({ message: 'Unauthorized' });
        };
      });
      
      await request(app)
        .post('/auth/link/google')
        .send({ googleId: 'google123' })
        .expect(401);
      
      expect(controller.linkGoogle).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/unlink/google', () => {
    it('should unlink Google account with JWT authentication', async () => {
      // Mock controller
      (controller.unlinkGoogle as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Google account unlinked' });
      });
      
      await request(app)
        .post('/auth/unlink/google')
        .expect(200);
      
      expect(mockAuthenticate).toHaveBeenCalledWith('jwt', { session: false });
      expect(controller.unlinkGoogle).toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/link/facebook', () => {
    it('should link Facebook account with JWT authentication', async () => {
      // Mock controller
      (controller.linkFacebook as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Facebook account linked' });
      });
      
      await request(app)
        .post('/auth/link/facebook')
        .send({ facebookId: 'facebook123' })
        .expect(200);
      
      expect(mockAuthenticate).toHaveBeenCalledWith('jwt', { session: false });
      expect(controller.linkFacebook).toHaveBeenCalled();
    });
    
    it('should reject unauthenticated requests', async () => {
      // Override mock to simulate auth failure
      (mockAuthenticate as jest.Mock).mockImplementation((strategy, options) => {
        return (req, res, next) => {
          res.status(401).json({ message: 'Unauthorized' });
        };
      });
      
      await request(app)
        .post('/auth/link/facebook')
        .send({ facebookId: 'facebook123' })
        .expect(401);
      
      expect(controller.linkFacebook).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /auth/unlink/facebook', () => {
    it('should unlink Facebook account with JWT authentication', async () => {
      // Mock controller
      (controller.unlinkFacebook as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Facebook account unlinked' });
      });
      
      await request(app)
        .post('/auth/unlink/facebook')
        .expect(200);
      
      expect(mockAuthenticate).toHaveBeenCalledWith('jwt', { session: false });
      expect(controller.unlinkFacebook).toHaveBeenCalled();
    });
  });
});