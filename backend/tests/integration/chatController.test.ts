// tests/integration/chatController.test.ts
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../setup/jest.setup';
import { User } from '../../src/types/user';

describe('Chat Controller', () => {
  let authToken: string;
  let testUser: User;
  let anotherUser: User;

  beforeEach(async () => {

    // Create user for each test
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123!',
      });
    testUser = registerResponse.body;

    const anotherRegisterResponse = await request(app)
      .post('/api/register')
      .send({
        name: 'Another User',
        email: 'anotheruser@example.com',
        password: 'Password123!',
      });
    anotherUser = anotherRegisterResponse.body;

    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'testuser@example.com',
        password: 'Password123!',
      });
    authToken = loginResponse.body.token;
  });

  describe('GET /api/user-chats', () => {
    it('should retrieve all chats for the authenticated user', async () => {
      // Create a group chat
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'Test Group',
          groupAvatar: 'group-avatar.png',
        });
      const chat = createChatResponse.body;

      const response = await request(app)
        .get('/api/user-chats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('chat');
      expect(response.body[0].chat).toHaveProperty('id', chat.id);
    });

    it('should return an empty array if the user has no chats', async () => {
      const response = await request(app)
        .get('/api/user-chats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 if the user is not authenticated', async () => {
      await request(app)
        .get('/api/user-chats')
        .expect(401);
    });
  });

  describe('POST /api/chats', () => {
    it('should create a new group chat successfully', async () => {
      const chatData = {
        chatType: 'group',
        participantIds: [anotherUser.id],
        groupName: 'New Group',
        groupAvatar: 'new-group-avatar.png',
      };

      const response = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.chatType).toBe('group');
      expect(response.body.groupName).toBe(chatData.groupName);
      expect(response.body.participants.length).toBe(2); // Creator + anotherUser
    });

    it('should return an existing private chat if it already exists', async () => {
      // Create private chat between testUser and anotherUser
      const firstChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'private',
          participantIds: [anotherUser.id],
        })
        .expect(201);
      const firstChat = firstChatResponse.body;


      // Try create private chat between two users
      const secondChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'private',
          participantIds: [anotherUser.id],
        })
        .expect(201);
      const secondChat = secondChatResponse.body;

      expect(secondChat.id).toBe(firstChat.id); // Must be return the same chat
    });

    it('should return 400 for invalid input', async () => {
      const invalidChatData = {
        chatType: 'invalidType', // Invalid type
        participantIds: [],
      };

      const response = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidChatData)
        .expect(400);

        expect(response.body).toEqual({ message: 'Invalid input data' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      await request(app)
        .post('/api/chats')
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'No Auth Group',
          groupAvatar: 'no-auth-avatar.png',
        })
        .expect(401);
    });
  });

  describe('GET /api/chats/:chatId', () => {
    it('should retrieve chat details for a valid chat and user', async () => {
      // Create a group chat
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'Detailed Group',
          groupAvatar: 'detailed-avatar.png',
        });
      const chat = createChatResponse.body;

      const response = await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', chat.id);
      expect(response.body).toHaveProperty('chatType', 'group');
      expect(response.body.participants.length).toBe(2);
    });

    it('should return 404 if the chat does not exist', async () => {
      await request(app)
        .get('/api/chats/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 if the user is not a participant of the chat', async () => {
      // Create a group chat with anotherUser
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'Non-participant Group',
          groupAvatar: 'non-participant-avatar.png',
        });
      const chat = createChatResponse.body;

      // Create an other user not in chat
      const thirdUserResponse = await request(app)
        .post('/api/register')
        .send({
          name: 'Third User',
          email: 'thirduser@example.com',
          password: 'Password123!',
        });
      const thirdUser = thirdUserResponse.body;

      // Login with thirdUser to take token
      const thirdLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'thirduser@example.com',
          password: 'Password123!',
        });
      const thirdAuthToken = thirdLoginResponse.body.token;

      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${thirdAuthToken}`)
        .expect(404);
    });

    it('should return 401 if the user is not authenticated', async () => {
      await request(app)
        .get('/api/chats/1')
        .expect(401);
    });
  });

  describe('DELETE /api/chats/:chatId/leave', () => {
    it('should allow user to leave a group chat successfully', async () => {
      // Create a group chat
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'Leave Group',
          groupAvatar: 'leave-avatar.png',
        });
      const chat = createChatResponse.body;

      // Current user leaves chat
      const response = await request(app)
        .delete(`/api/chats/${chat.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Successfully left chat');

      // Verify that the user leaves the chat
      const userChatsResponse = await request(app)
        .get('/api/user-chats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const isStillInChat = userChatsResponse.body.some((userChat: any) => userChat.chat.id === chat.id);
      expect(isStillInChat).toBe(false);
    });

    it('should delete the chat if only one participant remains', async () => {
      // Create a group chat with two participants
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'group',
          participantIds: [anotherUser.id],
          groupName: 'Single Participant Group',
          groupAvatar: 'single-avatar.png',
        });
      const chat = createChatResponse.body;

      // Create an other user and participate in the chat
      const thirdUserResponse = await request(app)
        .post('/api/register')
        .send({
          name: 'Third User',
          email: 'thirduser@example.com',
          password: 'Password123!',
        });
      const thirdUser = thirdUserResponse.body;

      const thirdLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'thirduser@example.com',
          password: 'Password123!',
        });
      const thirdAuthToken = thirdLoginResponse.body.token;

      await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${thirdAuthToken}`)
        .send({
          chatType: 'group',
          participantIds: [testUser.id],
          groupName: 'Single Participant Group',
          groupAvatar: 'single-avatar.png',
        });

      // User leaves the chat
      await request(app)
        .delete(`/api/chats/${chat.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify the chat is deleted
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should throw an error if trying to leave a private chat', async () => {
      // Create a private chat
      const createChatResponse = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatType: 'private',
          participantIds: [anotherUser.id],
        });
      const chat = createChatResponse.body;

      // User tries to leave the chat
      const response = await request(app)
        .delete(`/api/chats/${chat.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('message', 'Cannot leave private chat');
    });

    it('should return 404 if the chat does not exist', async () => {
      await request(app)
        .delete('/api/chats/9999/leave')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });

    it('should return 401 if the user is not authenticated', async () => {
      await request(app)
        .delete('/api/chats/1/leave')
        .expect(401);
    });
  });
});
