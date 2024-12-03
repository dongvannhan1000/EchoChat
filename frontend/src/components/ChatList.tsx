import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserChat } from '@/types/chat'
import { memo } from "react"
import { useAuth } from '@/hooks/useAuth'

interface ChatListProps {
  chats: UserChat[]
  selectedChatId: number | null
  onSelectChat: (chatId: number) => void
}

export default memo(function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
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

  return (
    <ul className="overflow-y-auto h-[calc(100vh-120px)]">
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
              {!chat.isSeen && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  New
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
})