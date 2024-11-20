import React, { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chat, Message } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ChatWindowProps {
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentChat, messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  
  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    )
  }

  const isGroupChat = currentChat.chatType === 'group'

  const getChatName = () => {
    if (isGroupChat) {
      return currentChat.groupName || 'Group Chat'
    }
    const otherUser = currentChat.participants.find(p => p.userId !== user?.id)
    return otherUser?.user.name || 'Chat'
  }

  const getChatAvatar = () => {
    if (isGroupChat) {
      return currentChat.groupAvatar || '/placeholder.svg?height=40&width=40'
    }
    const otherUser = currentChat.participants.find(p => p.userId !== user?.id)
    return otherUser?.user.avatar || '/placeholder.svg?height=40&width=40'
  }
  console.log('ChatWindow render')
  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={getChatAvatar()} alt={getChatName()} />
          <AvatarFallback>{getChatName().split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold text-gray-800">{getChatName()}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        {messages.map((message) => {
          const isCurrentUserMessage = message.senderId === user?.id
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isCurrentUserMessage && (
                <Avatar className="mr-2">
                  <AvatarImage src={message.sender.avatar || '/placeholder.svg?height=40&width=40'} alt={message.sender.name} />
                  <AvatarFallback>{message.sender.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  isCurrentUserMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {!isCurrentUserMessage && isGroupChat && (
                  <p className="text-xs font-semibold mb-1">{message.sender.name}</p>
                )}
                <p>{message.content}</p>
                <span className="text-xs mt-1 block">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    </>
  )
}