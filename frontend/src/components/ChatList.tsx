import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserChat } from '@/types/chat'
import { memo, useState } from "react"
import { useAuth } from '@/hooks/useAuth'
import { MoreVertical, LogOut } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"

interface ChatListProps {
  chats: UserChat[]
  selectedChatId: number | null
  onSelectChat: (chatId: number) => void
  onLeaveChat: (chatId: number) => Promise<void>
}

export default memo(function ChatList({ 
  chats, 
  selectedChatId, 
  onSelectChat,
  onLeaveChat}: ChatListProps) {
  const { user } = useAuth();
  console.log('ChatList render')

  const getOtherUser = (chat: UserChat) => {
    if (!chat.chat) {
      console.error("Chat object is undefined:", chat);
      return {
        name: 'Unknown Chat',
        avatar: '/placeholder.svg?height=40&width=40',
      };
    }
    
    if (chat.chat.chatType === 'group') {
      return {
        name: chat.chat.groupName || 'Group Chat',
        avatar: chat.chat.groupAvatar
      }
    }
    
    const otherParticipant = chat.chat.participants.find(
      p => p.userId !== user?.id
    );

    return {
      name: otherParticipant?.user.name || 'Unknown User',
      avatar: otherParticipant?.user.avatar
    }
  }
  
  const [statusMessage, setStatusMessage] = useState('')

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <input
          type="text"
          value={statusMessage}
          onChange={(e) => {setStatusMessage(e.target.value)}}
          placeholder="Update your status..."
          className="w-full p-2 border rounded"
        />
        <button 
          onClick={() => {onUpdateStatusMessage(statusMessage)}}
          className="mt-2 p-2 bg-blue-500 text-white rounded"
        >
          Update Status
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto">
      {chats.map((chat, index) => {
        const otherUser = getOtherUser(chat);
        return (
          <li
            key={`${String(chat.chatId)}-${String(index)}`}
            className={`p-4 hover:bg-gray-100 cursor-pointer ${
              selectedChatId === chat.chatId ? 'bg-gray-100' : ''
            }`}
            onClick={() => {onSelectChat(chat.chatId)}}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage 
                  src={otherUser.avatar || '/placeholder.svg?height=40&width=40'} 
                  alt={otherUser.name} 
                />
                <AvatarFallback>
                  {otherUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-gray-800">
                    {otherUser.name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{chat.lastMessage}</p>
              </div>
              <div className="flex items-center space-x-2">
                {!chat.isSeen && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    New
                  </span>
                )}
                {chat.chat?.chatType === 'group' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => void onLeaveChat(chat.chatId)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Leave Group</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </li>
        )
      })}
      </ul>
    </div> 
  )
})