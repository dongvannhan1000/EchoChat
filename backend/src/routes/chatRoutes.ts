import express from 'express';
import * as chatController from '../controllers/chatController';

const router = express.Router();

// API Conversations

router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversation);
router.put('/conversations/:id', chatController.updateConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

// API Participants

router.post('/conversations/:id/participants', chatController.addParticipant);
router.delete('/conversations/:id/participants/:userId', chatController.deleteParticipant);
router.get('/conversations/:id/participants', chatController.getParticipants);

// API Messages

router.post('/conversations/:id/messages', chatController.addMessage);
router.get('/conversations/:id/messages', chatController.getMessages);
router.get('/messages/:id', chatController.getMessage);
router.delete('/messages/:id', chatController.deleteMessage);

export default router;