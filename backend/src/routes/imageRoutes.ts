import express from 'express';
import { 
  uploadUserAvatar,
  uploadChatAvatar,
  uploadMessageImage,
  getUserAvatar,
  getChatAvatar,
  getMessageImage,
  deleteUserAvatar,
  deleteChatAvatar,
  deleteMessageImage
} from '../controllers/imageController';
import multer from 'multer';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload routes
router.post('/api/images/user/avatar', isAuth, upload.single('image'), uploadUserAvatar as express.RequestHandler);
router.post('/api/images/chat/avatar', isAuth, upload.single('image'), uploadChatAvatar as express.RequestHandler);
router.post('/api/images/message/image', isAuth, upload.single('image'), uploadMessageImage as express.RequestHandler);

// Get routes
router.get('/api/images/user/:userId/avatar', isAuth, getUserAvatar as express.RequestHandler);
router.get('/api/images/chat/:chatId/avatar', isAuth, getChatAvatar as express.RequestHandler);
router.get('/api/images/message/:messageId/image', isAuth, getMessageImage as express.RequestHandler);

// Delete routes
router.delete('/api/images/user/avatar', isAuth, deleteUserAvatar as express.RequestHandler);
router.delete('/api/images/chat/:chatId/avatar', isAuth, deleteChatAvatar as express.RequestHandler);
router.delete('/api/images/message/:messageId/image', isAuth, deleteMessageImage as express.RequestHandler);

export default router;