import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../models/prisma';

export class ImageService {

  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME as string;
    const region = process.env.AWS_REGION as string;
    
    if (!this.bucketName || !region) {
      throw new Error('AWS_S3_BUCKET_NAME or AWS_REGION is not defined in environment variables');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  async uploadImage(file: Express.Multer.File, userId?: number, chatId?: number, messageId?: number) {
    // Assure just one parameter provided
    const providedParams = [userId, chatId, messageId].filter(param => param !== undefined);
    if (providedParams.length !== 1) {
      throw new Error('Exactly one of userId, chatId, or messageId must be provided');
    }

    const fileKey = `images/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    const params = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {

      let existingImage = null;
      if (userId) {
        existingImage = await prisma.image.findUnique({ where: { userId } });
      } else if (chatId) {
        existingImage = await prisma.image.findUnique({ where: { chatId } });
      } else if (messageId) {
        existingImage = await prisma.image.findUnique({ where: { messageId } });
      }


      await this.s3Client.send(new PutObjectCommand(params));

      const s3Url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;


      let imageMetadata;
      
      if (existingImage) {
        // Update current image with new infos
        imageMetadata = await prisma.image.update({
          where: { id: existingImage.id },
          data: {
            url: s3Url,
            key: fileKey,
          },
        });
        
        // Delete old image from S3
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: existingImage.key,
            })
          );
        } catch (deleteError) {
          console.warn('Could not delete old image from S3:', deleteError);
          // Not throw error because the rest of the transaction has succeeded
        }
      } else {
        // Create a new record for image
        const data: any = {
          url: s3Url,
          key: fileKey,
        };

        if (userId) data.userId = userId;
        if (chatId) data.chatId = chatId;
        if (messageId) data.messageId = messageId;

        imageMetadata = await prisma.image.create({ data });
      }

      // Create presigned URL to client can access images
      const presignedUrl = await this.getPresignedUrl(fileKey);
      return { ...imageMetadata, presignedUrl };
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error('Failed to upload image');
    }
  }

  async getImage(type: 'user' | 'chat' | 'message', id: number) {
    try {
      let whereClause: any = {};
      
      if (type === 'user') {
        whereClause = { userId: id };
      } else if (type === 'chat') {
        whereClause = { chatId: id };
      } else if (type === 'message') {
        whereClause = { messageId: id };
      }

      const image = await prisma.image.findUnique({
        where: whereClause
      });

      if (!image) {
        return null; 
        // Return null instead of throw error because entity may be without image
      }

      // Create presigned URL to client can access images
      const presignedUrl = await this.getPresignedUrl(image.key);
      return { ...image, presignedUrl };
    } catch (error) {
      console.error('Error getting image:', error);
      throw new Error('Failed to get image');
    }
  }

  async deleteImage(type: 'user' | 'chat' | 'message', id: number) {
    try {
      let whereClause: any = {};
      
      if (type === 'user') {
        whereClause = { userId: id };
      } else if (type === 'chat') {
        whereClause = { chatId: id };
      } else if (type === 'message') {
        whereClause = { messageId: id };
      }

      const image = await prisma.image.findUnique({
        where: whereClause
      });

      if (!image) {
        throw new Error('Image not found');
      }

      // Delete images from S3 bucket
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: image.key
        })
      );

      // Delete metadata from database
      await prisma.image.delete({
        where: { id: image.id }
      });

      return { success: true, message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  private async getPresignedUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate access URL for image');
    }
  }
}
}

