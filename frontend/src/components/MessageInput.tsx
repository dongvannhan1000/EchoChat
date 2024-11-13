import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MessageInputProps {
  onSendMessage: (message: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); }}
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