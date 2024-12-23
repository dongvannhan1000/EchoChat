import React, { useState } from 'react'
import { Send, Ban } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chat, User } from '@/types/chat'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  currentChat: Chat | null
  user: User | null
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, currentChat, user }) => {
  const [newMessage, setNewMessage] = useState('')


   if (!currentChat || !user) return null;
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