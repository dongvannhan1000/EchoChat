import express from 'express';
import * as messageController from '../controllers/messageController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuth);

// API Chat
router.get('/api/chats/:chatId/messages', messageController.getChatMessages as express.RequestHandler);
router.post('/api/chats/:chatId/messages', messageController.sendMessage as express.RequestHandler);
router.delete('/api/messages/:messageId', messageController.deleteMessage as express.RequestHandler);

export default router;