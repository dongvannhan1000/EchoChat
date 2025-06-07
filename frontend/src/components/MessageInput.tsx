import React, { useEffect, useState, useRef } from 'react'
import { Send, Ban, Loader2, Image, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChatStore } from '@/stores/useChatV2'
import { imageUploadService } from '@/services/imageUploadService'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { MessageType, Message} from '@/types/chat'

interface MessageInputProps {
  onSendMessage: (message: string, type: MessageType, imageFileKey?: string, replyToId?: number) => Promise<Message>
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth();
  // const { selectedUser} = useUser();
  const { currentChat } = useChatStore()



  useEffect(() => {
    if (user && currentChat) {
      setIsLoading(false)
    }
  }, [user, currentChat])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file using service
    const validation = imageUploadService.validateImageFile(file)
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedImage) return
    if (!currentChat) return

    setIsUploading(true)
    try {
      let imageFileKey: string | undefined

      // Upload image first if present
      if (selectedImage) {
        try {
          const uploadResult = await imageUploadService.uploadMessageImage(currentChat.id, selectedImage)
          
          // Extract file key from the service (you might need to modify the service to return this)
          imageFileKey = extractFileKeyFromUrl(uploadResult)
          // const confirmResult = await imageUploadService.confirmMessageImageUpload(imageFileKey, currentChat.id)
          // imageUrl = confirmResult
        } catch (error) {
          toast.error('Failed to upload image')
          setIsUploading(false)
          return
        }
      }

      // Send message with image URL
      const message = await onSendMessage(newMessage, 'normal', imageFileKey, undefined)
      console.log(message)
      // if (imageFileKey) {
      //   await imageUploadService.confirmMessageImageUpload(imageFileKey, message.id);
      // }
      
      // Clear form
      setNewMessage("")
      removeImage()
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setIsUploading(false)
    }
  }

  const extractFileKeyFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.substring(1) // Remove leading slash
    } catch {
      return ''
    }
  }

  if (isLoading || !user || !currentChat) {
    return (
      <div className="bg-gray-100 border-t border-gray-200 p-4">
        <div className="flex items-center justify-center text-gray-500 space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  // console.log('currentChat:', currentChat);
  // console.log('participants:', currentChat?.participants);
  // console.log('user:', user);
  // console.log('user.id:', user?.id);
  const isPrivateChat = currentChat.chatType === 'private'
  const otherParticipant = isPrivateChat 
    ? currentChat.participants.find(p => p.userId !== user.id)
    : null

  // console.log('otherParticipant:', otherParticipant)
  // console.log('user.block:', user.block)
  // console.log('otherParticipant?.user.block:', otherParticipant?.user.block)
  
  const isBlocked = otherParticipant?.user.block.includes(user.id) || false
  const hasBlocked = user.block.includes(otherParticipant?.userId || 0) || false

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (newMessage.trim()) {
  //     onSendMessage(newMessage)
  //     setNewMessage('')
  //   }
  // }
   if (isPrivateChat && (isBlocked || hasBlocked)) {
    return (
      <div className="bg-gray-100 border-t border-gray-200 p-4">
        <div className="flex items-center justify-center text-gray-500 space-x-2">
          <Ban className="h-5 w-5" />
          <span>
            {hasBlocked ? "You have blocked this user" : "You have been blocked by this user"}
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="max-w-xs max-h-32 object-cover" />
            <button
              type="button"
              onClick={removeImage}
              disabled={isUploading}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">{selectedImage?.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-end space-x-2">
          <div className="flex-1 space-y-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isUploading}
              className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-1">
            {/* Image Upload Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Image className="h-4 w-4" />
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || isUploading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleImageSelect} 
          className="hidden" 
          disabled={isUploading}
        />
      </form>
    </div>
  )

}