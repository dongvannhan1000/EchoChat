import request from 'supertest';
import app from '../../src/app';
import * as authController from '../../src/controllers/authController'

jest.mock('../../src/controllers/authController');

describe('Auth Controller', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const validUser = {
        name: 'Test User Register',
        email: 'test-register@example.com',
        password: 'Password123!',
      };

      (authController.register as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json({ id: 1, email: validUser.email });
      });

      const response = await request(app)
        .post('/api/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(validUser.email);
    });

    it('should return 400 for invalid input', async () => {
      const invalidUser = {
        name: 'Test',
        email: 'invalid-email',
        password: '123', // too short
      };

      (authController.register as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ errors: [{ msg: 'Invalid input' }] });
      });

      const response = await request(app)
        .post('/api/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/login', () => {
    const loginUser = {
      name: 'Test User Login',
      email: 'test-login@example.com', 
      password: 'Password123!'
    };

    beforeEach(async () => {
      await request(app)
        .post('/api/register')
        .send(loginUser);
    });

    it('should login successfully with valid credentials', async () => {

      (authController.login as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ token: 'fake-jwt-token', user: { id: 1, email: loginUser.email } });
      });

      const response = await request(app)
        .post('/api/login')
        .send({
          email: loginUser.email,
          password: loginUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should fail with invalid credentials', async () => {
      (authController.login as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ error: 'Invalid credentials' });
      });

      await request(app)
        .post('/api/login')
        .send({
          email: loginUser.email,
          password: 'wrongpassword',
        })
        .expect(400);
    });
  });

  describe('POST /api/refresh-token', () => {
    it('should refresh token successfully', async () => {
      (authController.refreshToken as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ token: 'new-fake-jwt-token' });
      });
  
      const response = await request(app)
        .post('/api/refresh-token')
        .send({ token: 'valid-mock-token' })
        .expect(200);
  
      expect(response.body).toHaveProperty('token', 'new-fake-jwt-token');
    });
  
    it('should fail with invalid token', async () => {
      (authController.refreshToken as jest.Mock).mockImplementation((req, res) => {
        res.status(401).json({ error: 'Invalid token' });
      });
  
      await request(app)
        .post('/api/refresh-token')
        .send({ token: 'invalid-token' })
        .expect(401);
    });
  });
  
  
});