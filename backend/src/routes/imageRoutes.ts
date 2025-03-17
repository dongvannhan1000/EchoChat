import express from 'express';
import { uploadImage } from '../controllers/imageController';
import multer from 'multer';

const router = express.Router();
const upload = multer();

router.post('/api/images/upload', upload.single('image'), uploadImage);

export default router;