import express from 'express';
import {
  generateUserAvatarUrl,
  generateChatAvatarUrl,
  generateMessageImageUrl,
  confirmUpload
} from '../controllers/presignedUrlController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Generate presigned URLs
router.post('/api/avatar/presign', isAuth, generateUserAvatarUrl);
router.post('/api/chats/:chatId/avatar/presign', isAuth, generateChatAvatarUrl);
router.post('/api/chats/:chatId/message/presign', isAuth, generateMessageImageUrl);

// Confirm upload completion
router.post('/api/upload/confirm', isAuth, confirmUpload);

export default router;