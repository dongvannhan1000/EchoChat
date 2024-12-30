import express from 'express';
import * as userController from '../controllers/userController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/api/users/block', isAuth, userController.blockUser as express.RequestHandler);
router.post('/api/users/unblock', isAuth, userController.unblockUser as express.RequestHandler);
router.put('/api/users/status', isAuth, userController.updateStatus as express.RequestHandler);

router.get('/api/users/:id', userController.getUser);
router.put('/api/users/:id', isAuth, userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users', userController.getUsers);



export default router;