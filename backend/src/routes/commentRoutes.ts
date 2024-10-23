import express from 'express';
import { isAuth } from '../middleware/authMiddleware';
import * as commentController from '../controllers/commentController';

const router = express.Router();

router.post('/api/comments', isAuth, commentController.createComment);
router.put('/api/comments/:id', isAuth, commentController.editComment);
router.delete('/api/comments/:id', isAuth, commentController.deleteComment);

export default router;