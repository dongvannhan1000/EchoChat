// authRoutes.ts

import express from 'express';
import * as authController from '../controllers/authController';
import { validateRegistration, validate } from '../middleware/validation';

const router = express.Router();

router.post('/api/register', validateRegistration, validate, authController.register);
router.post('/api/login', authController.login);
router.post('/api/logout', authController.logout);
router.post('/api/refresh-token', authController.refreshToken);

export default router;
