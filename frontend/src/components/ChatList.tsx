import { UserChat } from '@/types/chat'
import { memo, useState } from "react"
import { useAuth } from '@/hooks/useAuth'
import { ChatListItem } from './ChatListItem'
import { useChat } from '@/stores/useChat'


interface ChatListProps {
  chats: UserChat[]
  selectedChatId: number | null
  onSelectChat: (chatId: number, id: number) => void
  onLeaveChat: (chatId: number) => Promise<void>
}

export default memo(function ChatList({ 
  chats, 
  selectedChatId, 
  onSelectChat,
  onLeaveChat}: ChatListProps) {
  const { user } = useAuth();
  const { markChatStatus } = useChat();
  console.log('ChatList render')

  

  const handleMarkChatStatus = async (id: number) => {
    try {
      await markChatStatus(id);
      console.log('markChatStatus called successfully');
    } catch (error) {
      console.error('Failed to change chat status:', error);
    }
  }

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
      <ul className="flex-1 overflow-y-auto">
      {chats.map((chat, index) => (
          <ChatListItem
              key={`${String(chat.chatId)}-${String(index)}`}
              chat={chat}
              isSelected={selectedChatId === chat.chatId}
              onSelectChat={onSelectChat}
              onLeaveChat={onLeaveChat}
              onMarkChatStatus={handleMarkChatStatus}
              otherUser={getOtherUser(chat)}
            />
          ))}
      </ul>
  )
})