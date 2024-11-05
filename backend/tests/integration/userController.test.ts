// tests/integration/userController.test.ts
import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/models/prisma';

describe('User Controller', () => {
  
  describe('GET /api/users/:id', () => {
    it('should retrieve a user by ID successfully', async () => {
      const user = await User.create({
        data: {
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'Password123!',
        },
      });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', user.id);
      expect(response.body).toHaveProperty('email', user.email);
    });

    it('should return 404 if user is not found', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user successfully', async () => {
      const user = await User.create({
        data: {
          name: 'Old Name',
          email: 'olduser@example.com',
          password: 'Password123!',
        },
      });

      const updatedData = { name: 'Updated Name', avatar: 'new-avatar.png' };

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('avatar', updatedData.avatar);
    });

    it('should return 500 if update fails', async () => {
      await request(app)
        .put('/api/users/invalid-id')
        .send({ name: 'Invalid Update' })
        .expect(500);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user successfully', async () => {
      const user = await User.create({
        data: {
          name: 'Delete User',
          email: 'deleteuser@example.com',
          password: 'Password123!',
        },
      });

      await request(app)
        .delete(`/api/users/${user.id}`)
        .expect(204);

      const deletedUser = await User.findUnique({ where: { id: user.id } });
      expect(deletedUser).toBeNull();
    });

    it('should return 500 if deletion fails', async () => {
      await request(app)
        .delete('/api/users/invalid-id')
        .expect(500);
    });
  });

  describe('GET /api/users', () => {
    it('should retrieve users based on search query', async () => {
      await User.createMany({
        data: [
          { name: 'Alice', email: 'alice@example.com', password: 'Password123!' },
          { name: 'Bob', email: 'bob@example.com', password: 'Password123!' },
        ],
      });

      const response = await request(app)
        .get('/api/users?search=Ali')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Ali');
    });

    it('should return all users if no search query is provided', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
