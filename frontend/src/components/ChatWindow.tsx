import React, { useRef, useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Message } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, User, UserMinus, UserPlus, Users } from 'lucide-react'
import { useChatStore } from '@/stores/useChatV2'
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
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onEditMessage: (messageId: number, content: string, image?: string | null) => Promise<void>
  onDeleteMessage: (messageId: number) => void
  // onPinMessage: (messageId: number) => void
}

export const ChatWindow: React.FC<ChatWindowProps> = (({ 
  messages, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onEditMessage, 
  onDeleteMessage }) => {

  const { currentChat } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);

  const [lastValidChat, setLastValidChat] = useState(currentChat);


  useEffect(() => {
    if (currentChat && currentChat.participants) {
      setLastValidChat(currentChat);
    }
  }, [currentChat]);

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
    if (!lastValidChat) return 'Unknown Chat';
    if (lastValidChat.chatType === 'group') {
      return lastValidChat.groupName || 'Unnamed Group';
    }
    const otherUser = lastValidChat.participants.find(
      (p) => p.userId !== user?.id
    );
    return otherUser?.user.name || 'Unknown User';
  };
  
  const getChatAvatar = () => {
    if (!lastValidChat) return '/placeholder.svg?height=40&width=40';
    if (lastValidChat.chatType === 'group') {
      return lastValidChat.groupAvatar?.url || '/placeholder.svg?height=40&width=40';
    }
    const otherUser = lastValidChat.participants.find(
      (p) => p.userId !== user?.id
    );
    return otherUser?.user.avatar?.url || '/placeholder.svg?height=40&width=40';
  };
  
  const handleEditClick = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };
  
  const handleEditSubmit = () => {
    if (editingMessageId !== null) {
      const imageToEdit = editImage || undefined;
      void onEditMessage(
        editingMessageId, 
        editContent, 
        imageToEdit
      );
      setEditingMessageId(null);
      setEditContent('');
      setEditImage(null);
    }
  };
  


  return (
    <>
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
        {lastValidChat ? (
          <>
            <Avatar>
              <AvatarImage src={getChatAvatar()} alt={getChatName()} />
              <AvatarFallback>
                {getChatName()
                  .split(' ')
                  .splice(0, 3)
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold text-gray-800">{getChatName()}</h2>
          </>
        ) : (
          <div className="text-gray-500 text-sm">Loading chat details...</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <User className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {user?.id === currentChat.createdBy ? "Welcome to your new chat!" : "No messages yet"}
          </h2>
          <p className="text-gray-500 max-w-md">
            {user?.id === currentChat.createdBy
              ? "Start the conversation by sending the first message. Your ideas and thoughts matter!"
              : "Be the first to break the ice! Share your thoughts or ask a question to get the conversation rolling."}
          </p>
        </div>
        ) : (
          <>
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
            const isEdited = message.isEdited
            const isSystemMessage = message.type === 'system'

            if (isSystemMessage) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full flex items-center space-x-2">
                    {message.content.includes('left the group') && <UserMinus className="h-4 w-4" />}
                    {message.content.includes('joined the group') && <UserPlus className="h-4 w-4" />}
                    {message.content.includes('created the group') && <Users className="h-4 w-4" />}
                    <span className="text-sm">{message.content}</span>
                  </div>
                </div>
              )
            }
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUserMessage && (
                  <Avatar className="mr-2">
                    <AvatarImage src={message.sender.avatar?.url || '/placeholder.svg?height=40&width=40'} alt={message.sender.name} />
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
                        className="mr-2 text-black bg-white"
                      />
                      <Button onClick={handleEditSubmit}>Save</Button>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  {isEdited && !isDeleted && (
                    <span className="text-xs text-yellow-400 mt-1 italic">Edited</span>
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
                          <DropdownMenuItem>
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
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  )
})