import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserChat } from '@/types/chat'
import { MoreVertical, Pin, BellOff, CheckCircle, LogOut, Eye } from 'lucide-react'
import { memo } from "react"

interface ChatListItemProps {
  chat: UserChat
  isSelected: boolean
  onSelectChat: (chatId: number) => void
  onLeaveChat: (chatId: number) => Promise<void>
  onMarkChatStatus: (id: number) => Promise<void>
  otherUser: {
    name: string
    avatar: string | undefined
  }
}

export const ChatListItem = memo(function ChatListItem({ 
  chat, 
  isSelected, 
  onSelectChat, 
  onLeaveChat,
  onMarkChatStatus,
  otherUser
}: ChatListItemProps) {

  console.log('Chat data in ChatListItem:', chat);
  return (
    <li
      className={`p-4 hover:bg-gray-100 cursor-pointer ${
        isSelected ? 'bg-gray-100' : ''
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPinChat(chat.id)}>
                <Pin className="h-4 w-4 mr-2" />
                Pin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMuteChat(chat.id)}>
                <BellOff className="h-4 w-4 mr-2" />
                Mute
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                console.log('Clicked chat:', chat);
                console.log('Chat ID:', chat.chatId);
                console.log('ID:', chat.id);
                void onMarkChatStatus(chat.id)}
                }>
                {chat.isSeen ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Mark as Unread
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Read
                  </>
                )}
              </DropdownMenuItem>
              {chat.chat?.chatType === 'group' && (
                <DropdownMenuItem onClick={() => void onLeaveChat(chat.chatId)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Leave Group</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  )
})

