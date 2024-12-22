import express from 'express';
import * as userController from '../controllers/userController';

const router = express.Router();

router.get('/api/users/:id', userController.getUser);
router.put('/api/users/:id', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users', userController.getUsers);

router.post('/api/users/block', userController.blockUser as express.RequestHandler);
router.post('/api/users/unblock', userController.unblockUser as express.RequestHandler);

export default router;