import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from '../models/prisma';

export class ImageService {

  private s3Client: S3Client;

  constructor() {
    if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_REGION) {
      throw new Error("AWS_S3_BUCKET_NAME is not defined in environment variables");
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }
  async uploadImage(file: Express.Multer.File) {

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const fileKey = `images/${Date.now()}-${file.originalname}`; 

    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      await this.s3Client.send(new PutObjectCommand(params));

      const imageUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

      // Lưu metadata vào PostgreSQL
      const imageMetadata = await prisma.image.create({
        data: {
          url: imageUrl,
          key: fileKey,
        },
      });

      return imageMetadata;
    } catch (error) {
      throw new Error('Failed upload');
    }
  }
}