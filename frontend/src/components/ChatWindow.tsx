import React, { useRef, useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chat, Message } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { formatMessageTime } from '@/utils/formatTime'
import { Button } from './ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { MoreVertical, Edit, Trash, Pin } from 'lucide-react'

interface ChatWindowProps {
  currentChat: Chat | null
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onEditMessage: (messageId: number, newContent: string) => void
  onDeleteMessage: (messageId: number) => void
  // onPinMessage: (messageId: number) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  currentChat, 
  messages, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onEditMessage, 
  onDeleteMessage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

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

  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content ?? '')
  }

  const handleEditSubmit = () => {
    if (editingMessageId !== null) {
      onEditMessage(editingMessageId, editContent)
      setEditingMessageId(null)
      setEditContent('')
    }
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
        {/* Thêm nút Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              See more messages
            </Button>
          </div>
        )}
        {messages.map((message) => {
          const isCurrentUserMessage = message.senderId === user?.id
          const isDeleted = !!message.deletedAt;
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
                  isCurrentUserMessage
                    ? isDeleted
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-blue-500 text-white'
                    : isDeleted
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-gray-200 text-gray-800'
                } ${isDeleted ? 'italic' : ''}`}
              >
                {!isCurrentUserMessage && isGroupChat && (
                  <p className="text-xs font-semibold mb-1">{message.sender.name}</p>
                )}
                {editingMessageId === message.id ? (
                  <div className="flex items-center">
                    <Input
                      value={editContent}
                      onChange={(e) => {setEditContent(e.target.value)}}
                      className="mr-2"
                    />
                    <Button onClick={handleEditSubmit}>Save</Button>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
                <span className="text-xs mt-1 block">
                  {formatMessageTime(new Date(message.createdAt).toISOString())}
                </span>
              </div>
              {isCurrentUserMessage && !isDeleted && (
                  <div className="self-end mt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {handleEditClick(message)}}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {onDeleteMessage(message.id)}}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {onPinMessage(message.id)}}>
                          <Pin className="mr-2 h-4 w-4" />
                          <span>Pin</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    </>
  )
}