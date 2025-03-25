import React, { useEffect, useState } from 'react'
import { Send, Ban, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChatStore } from '@/stores/useChatV2'
import { useAuth } from '@/hooks/useAuth'

interface MessageInputProps {
  onSendMessage: (message: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const { user } = useAuth();
  // const { selectedUser} = useUser();
  const { currentChat } = useChatStore()

  useEffect(() => {
    if (user && currentChat) {
      setIsLoading(false)
    }
  }, [user, currentChat])
  console.log(user)

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
  
  
  const isPrivateChat = currentChat.chatType === 'private'
  const otherParticipant = isPrivateChat 
    ? currentChat.participants.find(p => p.userId !== user.id)
    : null
  const isBlocked = otherParticipant?.user.block.includes(user.id) || false
  const hasBlocked = user.block.includes(otherParticipant?.userId || 0) || false

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }
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
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => {setNewMessage(e.target.value)}}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit">
          <Send size={20} />
        </Button>
      </div>
    </form>
  )

}