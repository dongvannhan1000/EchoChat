import api from "../utils/axios";

export interface PresignedUrlResponse {
    presignedUrl: string;
    fileKey: string;
    cloudFrontUrl: string;
  }
  
  export interface ConfirmUploadResponse {
    success: boolean;
    cloudFrontUrl: string;
  }
  
  class ImageUploadService {
    /**
     * Upload image for message
     */
    async uploadMessageImage(chatId: number, file: File): Promise<string> {
      try {
        // Step 1: Get presigned URL
        const presignedResponse = await this.getMessageImagePresignedUrl(chatId, file.type);
        
        // Step 2: Upload file to S3
        await this.uploadFileToS3(presignedResponse.presignedUrl, file);
        
        // Step 3: Return the CloudFront URL for immediate use
        return presignedResponse.presignedUrl;
      } catch (error) {
        console.error('Error uploading message image:', error);
        throw new Error('Failed to upload image');
      }
    }
  
    /**
     * Confirm upload completion (call this after message is created)
     */
    async confirmMessageImageUpload(fileKey: string, messageId: number): Promise<string> {
      try {
        const response = await api.post('/api/upload/confirm', {
          fileKey,
          type: 'message',
          messageId
        });
        return response.data.cloudFrontUrl;
      } catch (error) {
        console.error('Error confirming upload:', error);
        // Don't throw here - the image is already uploaded and usable
        return '';
      }
    }
  
    /**
     * Upload user avatar
     */
    async uploadUserAvatar(file: File): Promise<string> {
      try {
        const presignedResponse = await this.getUserAvatarPresignedUrl(file.type);
        await this.uploadFileToS3(presignedResponse.presignedUrl, file);
        
        // Confirm upload immediately for avatars
        await api.post('/api/upload/confirm', {
          fileKey: presignedResponse.fileKey,
          type: 'user'
        });
        
        return presignedResponse.cloudFrontUrl;
      } catch (error) {
        console.error('Error uploading user avatar:', error);
        throw new Error('Failed to upload avatar');
      }
    }
  
    /**
     * Upload chat avatar
     */
    async uploadChatAvatar(chatId: number, file: File): Promise<string> {
      try {
        const presignedResponse = await this.getChatAvatarPresignedUrl(chatId, file.type);
        await this.uploadFileToS3(presignedResponse.presignedUrl, file);
        
        // Confirm upload immediately for avatars
        await api.post('/api/upload/confirm', {
          fileKey: presignedResponse.fileKey,
          type: 'chat'
        });
        
        return presignedResponse.cloudFrontUrl;
      } catch (error) {
        console.error('Error uploading chat avatar:', error);
        throw new Error('Failed to upload avatar');
      }
    }
  
    private async getMessageImagePresignedUrl(chatId: number, contentType: string): Promise<PresignedUrlResponse> {
      const response = await api.post(`/api/chats/${chatId}/message/presign`, {
        contentType
      });
      return response.data;
    }
  
    private async getUserAvatarPresignedUrl(contentType: string): Promise<PresignedUrlResponse> {
      const response = await api.post('/api/avatar/presign', {
        contentType
      });
      return response.data;
    }
  
    private async getChatAvatarPresignedUrl(chatId: number, contentType: string): Promise<PresignedUrlResponse> {
      const response = await api.post(`/api/chats/${chatId}/avatar/presign`, {
        contentType
      });
      return response.data;
    }
  
    private async uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }
    }
  
    /**
     * Validate image file
     */
    validateImageFile(file: File): { isValid: boolean; error?: string } {
      // Check file type
      if (!file.type.startsWith('image/')) {
        return { isValid: false, error: 'Please select an image file' };
      }
  
      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { isValid: false, error: 'Image size must be less than 5MB' };
      }
  
      // Check supported formats
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        return { isValid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP' };
      }
  
      return { isValid: true };
    }
  }
  
  export const imageUploadService = new ImageUploadService();