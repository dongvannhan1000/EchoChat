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

router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

router
  .route('/api/users/:userId/avatar')
  .post(isAuth, upload.single('image'), uploadUserAvatar)
  .get(isAuth, getUserAvatar)
  .delete(isAuth, deleteUserAvatar);

router
  .route('/api/chats/:chatId/avatar')
  .post(isAuth, upload.single('image'), uploadChatAvatar)
  .get(   isAuth, getChatAvatar)
  .delete(isAuth, deleteChatAvatar);

router
  .route('/api/chats/:chatId/messages/:messageId/image')
  .post(isAuth, upload.single('image'), uploadMessageImage)
  .get(   isAuth, getMessageImage)
  .delete(isAuth, deleteMessageImage);



export default router;