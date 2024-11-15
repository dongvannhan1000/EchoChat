import express from 'express';
import * as userController from '../controllers/userController';

const router = express.Router();

router.get('/api/users/:id', userController.getUser);
router.put('/api/users/:id', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);
router.get('/api/users', userController.getUsers);

export default router;