import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../models/prisma';

export class PresignedUrlService {
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

  /**
   * Generate a pre-signed URL for uploading user avatar
   */
  async generateAvatarPresignedUrl(userId: number, contentType: string) {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate a unique file key
      const fileKey = `avatars/${userId}/${uuidv4()}${this.getFileExtension(contentType)}`;
      
      // Generate pre-signed URL (60 seconds expiration)
      const presignedUrl = await this.generatePresignedPutUrl(fileKey, contentType, 60);
      
      // Generate the CloudFront URL where the file will be accessible after upload
      const cloudFrontUrl = this.getCloudFrontUrl(fileKey);
      
      // Check if the user already has an avatar
      const existingImage = await prisma.image.findUnique({
        where: { userId }
      });

      // Store temporary metadata about the pending upload
      if (existingImage) {
        await prisma.pendingUpload.create({
          data: {
            key: fileKey,
            type: 'user',
            referenceId: userId,
            previousKey: existingImage.key,
            expiresAt: new Date(Date.now() + 60 * 1000) // 60 seconds from now
          }
        });
      } else {
        await prisma.pendingUpload.create({
          data: {
            key: fileKey,
            type: 'user',
            referenceId: userId,
            expiresAt: new Date(Date.now() + 60 * 1000) // 60 seconds from now
          }
        });
      }
      
      return {
        presignedUrl,
        fileKey,
        cloudFrontUrl
      };
    } catch (error) {
      console.error('Error generating presigned URL for avatar:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a pre-signed URL for uploading chat avatar
   */
  async generateChatAvatarPresignedUrl(chatId: number, userId: number, contentType: string) {
    try {
      // Check if chat exists and user has permissions
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: {
            where: { userId }
          }
        }
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      if (chat.participants.length === 0) {
        throw new Error('User is not a participant in this chat');
      }

      // TODO: Check if user has admin permissions in chat
      
      // Generate a unique file key
      const fileKey = `chats/${chatId}/avatar/${uuidv4()}${this.getFileExtension(contentType)}`;
      
      // Generate pre-signed URL (60 seconds expiration)
      const presignedUrl = await this.generatePresignedPutUrl(fileKey, contentType, 60);
      
      // Generate the CloudFront URL where the file will be accessible after upload
      const cloudFrontUrl = this.getCloudFrontUrl(fileKey);
      
      // Check if the chat already has an avatar
      const existingImage = await prisma.image.findUnique({
        where: { chatId }
      });

      // Store temporary metadata about the pending upload
      if (existingImage) {
        await prisma.pendingUpload.create({
          data: {
            key: fileKey,
            type: 'chat',
            referenceId: chatId,
            previousKey: existingImage.key,
            expiresAt: new Date(Date.now() + 60 * 1000) // 60 seconds from now
          }
        });
      } else {
        await prisma.pendingUpload.create({
          data: {
            key: fileKey,
            type: 'chat',
            referenceId: chatId,
            expiresAt: new Date(Date.now() + 60 * 1000) // 60 seconds from now
          }
        });
      }
      
      return {
        presignedUrl,
        fileKey,
        cloudFrontUrl
      };
    } catch (error) {
      console.error('Error generating presigned URL for chat avatar:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a pre-signed URL for uploading a message image
   */
  async generateMessageImagePresignedUrl(chatId: number, userId: number, contentType: string) {
    try {
      // Check if chat exists and user has permissions
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: {
            where: { userId }
          }
        }
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      if (chat.participants.length === 0) {
        throw new Error('User is not a participant in this chat');
      }
      
      // Generate a unique file key
      const fileKey = `chats/${chatId}/messages/${uuidv4()}${this.getFileExtension(contentType)}`;
      
      // Generate pre-signed URL (60 seconds expiration)
      const presignedUrl = await this.generatePresignedPutUrl(fileKey, contentType, 60);
      
      // Generate the CloudFront URL where the file will be accessible after upload
      // const cloudFrontUrl = this.getCloudFrontUrl(fileKey);
      
      // Store temporary metadata about the pending upload
      await prisma.pendingUpload.create({
        data: {
          key: fileKey,
          type: 'message',
          referenceId: chatId, // We'll associate with message later
          userId: userId, // Track who is uploading
          expiresAt: new Date(Date.now() + 60 * 1000) // 60 seconds from now
        }
      });
      
      return {
        presignedUrl,
        fileKey
        // cloudFrontUrl
      };
    } catch (error) {
      console.error('Error generating presigned URL for message image:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Confirm that an upload has completed and update the database accordingly
   */
  async confirmUpload(fileKey: string, type: 'user' | 'chat' | 'message', messageId?: number) {
    console.log('confirmUpload called:', { fileKey, type, messageId });
    try {
      // Find the pending upload
      const pendingUpload = await prisma.pendingUpload.findFirst({
        where: { 
          key: fileKey,
          type: type
        }
      });


      if (!pendingUpload) {
        throw new Error('No pending upload found for this key');
      }

      // Build the CloudFront URL
      const cloudFrontUrl = this.getCloudFrontUrl(fileKey);

      // Begin database transaction
      const result = await prisma.$transaction(async (prisma) => {
        // If there's an existing image, delete it (we'll clean up S3 on a schedule)
        if (pendingUpload.previousKey) {
          await prisma.image.deleteMany({
            where: {
              OR: [
                { userId: type === 'user' ? pendingUpload.referenceId : undefined },
                { chatId: type === 'chat' ? pendingUpload.referenceId : undefined },
                { messageId: messageId }
              ]
            }
          });
        }

        // Create new image record
        const imageData: any = {
          url: cloudFrontUrl,
          key: fileKey,
        };

        if (type === 'user') {
          imageData.userId = pendingUpload.referenceId;
        } else if (type === 'chat') {
          imageData.chatId = pendingUpload.referenceId;
        } else if (type === 'message') {
          if (!messageId) {
            throw new Error('Message ID is required for message image uploads');
          }
          const messageExists = await prisma.message.findUnique({
            where: { id: messageId }
          });

          if (!messageExists) {
            throw new Error('Message not found');
          }
          imageData.messageId = messageId;
        }

        const createdImage = await prisma.image.create({
          data: imageData
        });

        if (type === 'message' && messageId) {
          const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { imageId: createdImage.id }
          });
          console.log('Message updated with imageId:', updatedMessage.imageId);
        }

        // Delete the pending upload
        await prisma.pendingUpload.delete({
          where: { id: pendingUpload.id }
        });

        return createdImage;
      });

      return { success: true, cloudFrontUrl, image: result };
    } catch (error) {
      console.error('Error confirming upload:', error);
      throw new Error('Failed to confirm upload');
    }
  }

  /**
   * Generate a pre-signed URL for PUT operation
   */
  private async generatePresignedPutUrl(key: string, contentType: string, expiresIn = 60) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating presigned PUT URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Get the CloudFront URL for a file
   */
  private getCloudFrontUrl(key: string) {
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (cloudFrontDomain) {
      return `https://${cloudFrontDomain}/${key}`;
    }
    // Fall back to S3 URL if CloudFront is not configured
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Get file extension from content type
   */
  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    };
    
    return extensions[contentType] || '';
  }

  /**
   * Clean up expired pending uploads
   * This should be called by a scheduled job
   */
  async cleanupExpiredUploads() {
    try {
      const expiredUploads = await prisma.pendingUpload.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Delete expired pending uploads
      await prisma.pendingUpload.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return { deleted: expiredUploads.length };
    } catch (error) {
      console.error('Error cleaning up expired uploads:', error);
      throw new Error('Failed to clean up expired uploads');
    }
  }
}

export const presignedUrlService = new PresignedUrlService();