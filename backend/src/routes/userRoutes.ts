import express from 'express';
import * as userController from '../controllers/userController';
import { isAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/users/:id', userController.getUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', isAuth, userController.deleteUser);
router.get('/users', userController.getUsers);

export default router;