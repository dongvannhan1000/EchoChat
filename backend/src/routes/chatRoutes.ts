import express from 'express';
import * as chatController from '../controllers/chatController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuth);

// API Chat
router.get('/api/user-chats', chatController.getUserChats as express.RequestHandler);
router.post('/api/chats', chatController.createChat as express.RequestHandler);
router.get('/api/chats/:chatId', chatController.getChatDetails as express.RequestHandler);
router.delete('/api/chats/:chatId/leave', chatController.leaveChat as express.RequestHandler);

export default router;