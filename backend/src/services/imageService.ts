import s3 from '../config/aws';
import { prisma } from '../models/prisma';

export class ImageService {
  async uploadImage(file: Express.Multer.File) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `images/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    const uploadResult = await s3.upload(params).promise();

    // Lưu metadata vào PostgreSQL
    const imageMetadata = await prisma.image.create({
      data: {
        url: uploadResult.Location,
        key: uploadResult.Key
      }
    });

    return imageMetadata;
  }
}