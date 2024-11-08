import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';


describe('Auth Controller', () => {

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const validUser = {
        name: 'Test User Register',
        email: 'test-register@example.com',
        password: 'Password123!',
      };

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
    let validToken: string;
    let testUser: any;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          name: 'Test User Refresh',
          email: `test-refresh-${Date.now()}@example.com`, // Unique email
          password: 'Password123!'
        });
      testUser = registerResponse.body;

      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'Password123!',
        });
      validToken = loginResponse.body.token;
    });

    it('should refresh token successfully', async () => {
      // Use a shorter timeout or consider redesigning the test to avoid timing dependencies
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
      ) as any;
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