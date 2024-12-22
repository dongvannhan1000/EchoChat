import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserChat } from '@/types/chat'
import { MoreVertical, Pin, BellOff, CheckCircle, LogOut, Eye, BellRing, UserX, UserCheck } from 'lucide-react'
import { memo } from "react"
import { useAuth } from '@/hooks/useAuth'

interface ChatListItemProps {
  chat: UserChat
  isSelected: boolean
  onSelectChat: (chatId: number, id: number) => void
  onLeaveChat: (chatId: number) => Promise<void>
  onMarkChatStatus: (id: number) => Promise<void>
  otherUser: {
    name: string
    avatar: string | undefined
  }
  onPinChat: (id: number) => Promise<void>
  onMuteChat: (id: number, muteDuration?: number) => Promise<void>
  onBlockUser: (userId: number) => Promise<void>
  onUnblockUser: (userId: number) => Promise<void>
}

export const ChatListItem = memo(function ChatListItem({ 
  chat, 
  isSelected, 
  onSelectChat, 
  onLeaveChat,
  onMarkChatStatus,
  onPinChat,
  onMuteChat,
  otherUser, 
  onBlockUser,
  onUnblockUser
}: ChatListItemProps) {

  const { user } = useAuth();

  const getOtherUserId = () => {
    if (chat.chat.chatType === 'private') {
      const otherParticipant = chat.chat.participants.find(
        p => p.userId !== user.id
      );
      return otherParticipant?.userId;
    }
    return null;
  };

  return (
    <li
      className={`p-4 hover:bg-gray-100 cursor-pointer ${
        isSelected ? 'bg-gray-100' : ''
      }`}
      onClick={() => {onSelectChat(chat.chatId, chat.id)}}
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
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 truncate">
              {otherUser.name}
            </h2>
            <div className="flex items-center space-x-2">
              {chat.pinned && <Pin className="h-4 w-4 text-blue-500" />}
              {(chat.mutedUntil && new Date(chat.mutedUntil) > new Date()) && 
                <BellOff className="h-4 w-4 text-gray-500" />
              }
              <span className="text-xs text-gray-500">
                {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate mt-1">{chat.lastMessage}</p>
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
              
              <DropdownMenuItem onClick={() => void onPinChat(chat.id)}>
                {chat.pinned ? (
                  <>
                    <Pin className="h-4 w-4 mr-2 rotate-45" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              {chat.mutedUntil ? (
                <DropdownMenuItem onClick={() => void onMuteChat(chat.id, 0)}>
                  <BellRing className="h-4 w-4 mr-2" />
                  Unmute
                </DropdownMenuItem>
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <BellOff className="h-4 w-4 mr-2" />
                    <span>Mute</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => void onMuteChat(chat.id, 30 * 60)}>
                        30 minutes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void onMuteChat(chat.id, 60 * 60)}>
                        1 hour
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void onMuteChat(chat.id, 8 * 60 * 60)}>
                        8 hours
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void onMuteChat(chat.id, 24 * 60 * 60)}>
                        24 hours
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void onMuteChat(chat.id, undefined)}>
                        Until I turn on
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              <DropdownMenuItem onClick={() => {
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
              {chat.chat.chatType === 'group' && (
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

