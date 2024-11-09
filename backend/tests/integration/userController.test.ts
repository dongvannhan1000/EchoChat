// tests/integration/userController.test.ts
import request from 'supertest';
import app from '../../src/app';
import { createMockUser } from '../utils/mockUser';
import { User } from '../../src/models/prisma';

jest.mock('../../src/models/prisma', () => ({
  User: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn()
  },
}));

describe('User Controller', () => {
  
  describe('GET /api/users/:id', () => {
    it('should retrieve a user by ID successfully', async () => {
      const mockUser = createMockUser({ id: 1, name: 'Test User', email: 'testuser@example.com' });
      (User.findUnique as jest.Mock).mockResolvedValue(mockUser);
      

      const response = await request(app)
        .get(`/api/users/${mockUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', mockUser.id);
      expect(response.body).toHaveProperty('email', mockUser.email);
    });

    it('should return 404 if user is not found', async () => {
      (User.findUnique as jest.Mock).mockResolvedValue(null);

      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user successfully', async () => {
      const mockUser = createMockUser({ id: 1, name: 'Old Name', email: 'olduser@example.com', password: 'Password123!' });
      const updatedData = { name: 'Updated Name', avatar: 'new-avatar.png' };

      (User.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (User.update as jest.Mock).mockResolvedValue({ ...mockUser, ...updatedData });

      const response = await request(app)
        .put(`/api/users/${mockUser.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('avatar', updatedData.avatar);
    });

    it('should return 500 if update fails', async () => {
      (User.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await request(app)
        .put('/api/users/invalid-id')
        .send({ name: 'Invalid Update' })
        .expect(500);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user successfully', async () => {
      const mockUser = createMockUser({ id: 1, name: 'Delete User', email: 'deleteuser@example.com', password: 'Password123!' });

      (User.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (User.delete as jest.Mock).mockResolvedValue(mockUser);

      await request(app)
        .delete(`/api/users/${mockUser.id}`)
        .expect(204);

      expect(User.delete as jest.Mock).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should return 500 if deletion fails', async () => {
      (User.delete as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      await request(app)
        .delete('/api/users/invalid-id')
        .expect(500);
    });
  });

  describe('GET /api/users', () => {
    it('should retrieve users based on search query', async () => {
      const mockUsers = [
        createMockUser({ id: 1, name: 'Alice', email: 'alice@example.com', password: 'Password123!' }),
        createMockUser({ id: 2, name: 'Bob', email: 'bob@example.com', password: 'Password123!' }),
      ];

      (User.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users?search=Ali')
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Ali');
    });

    it('should return all users if no search query is provided', async () => {
      const mockUsers = [
        createMockUser({ id: 1, name: 'Alice', email: 'alice@example.com', password: 'Password123!' }),
        createMockUser({ id: 2, name: 'Bob', email: 'bob@example.com', password: 'Password123!' }),
      ];

      (User.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
