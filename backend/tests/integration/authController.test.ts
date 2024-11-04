// tests/integration/authController.test.ts
import request from 'supertest';
import app from '../../src/app';
import { User, UserChat, Message } from '../../src/models/prisma';
import jwt from 'jsonwebtoken'

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clear database before each test
    await UserChat.deleteMany();
    await Message.deleteMany();
    await User.deleteMany();
  });

  describe('POST /api/register', () => {
    const validUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
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

      const response = await request(app)
        .post('/api/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user before login tests
      await request(app)
        .post('/api/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should fail with invalid credentials', async () => {
      await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(400);
    });
  });

  describe('POST /api/refresh-token', () => {
    let validToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create user and get token

      const registerResponse = await request(app)
      .post('/api/register')
      .send({
        name: 'Test User',
        email: 'test-refresh@example.com',
        password: 'Password123!'
      });
      testUser = registerResponse.body;

      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'test-refresh@example.com',
          password: 'Password123!',
        });
      validToken = loginResponse.body.token;
    });

    it('should refresh token successfully', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/api/refresh-token')
        .send({ token: validToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(validToken);

      const decodedToken = jwt.verify(
        response.body.token, 
        process.env.JWT_SECRET || 'your_jwt_secret'
      );
      expect(decodedToken).toHaveProperty('id', testUser.id);
    });



    it('should fail with invalid token', async () => {
      await request(app)
        .post('/api/refresh-token')
        .send({ token: 'invalid-token' })
        .expect(401);
    });
  });
});