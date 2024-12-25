import express from 'express';
import * as userController from '../controllers/userController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/api/users/:id', userController.getUser);
router.put('/api/users/:id', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users', userController.getUsers);

router.post('/api/users/block', isAuth, userController.blockUser as express.RequestHandler);
router.post('/api/users/unblock', isAuth, userController.unblockUser as express.RequestHandler);

export default router;