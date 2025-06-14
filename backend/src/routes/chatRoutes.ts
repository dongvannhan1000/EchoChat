import express from 'express';
import * as chatController from '../controllers/chatController';
import { isAuth } from '../middleware/authMiddleware';
import { asyncWrapper } from '../utils/asyncWrapper';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(isAuth);

// API Chat
router.get('/api/chats', asyncWrapper(chatController.getUserChats));
router.post('/api/chats', chatController.createChat as express.RequestHandler);
router.get('/api/chats/:chatId', chatController.getChatDetails as express.RequestHandler);
router.delete('/api/chats/:chatId/leave', chatController.leaveChat as express.RequestHandler);


router.put('/api/chats/:id/toggle-read', chatController.markChatStatus as express.RequestHandler);
router.put('/api/chats/:id/pin', chatController.pinChat as express.RequestHandler);
router.put('/api/chats/:id/mute', chatController.muteChat as express.RequestHandler);

export default router;