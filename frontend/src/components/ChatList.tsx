import { UserChat } from '@/types/chat'
import { memo } from "react"
import { useAuth } from '@/hooks/useAuth'
import { ChatListItem } from './ChatListItem'
import { useUserChatInteractionsStore } from '@/stores/useInteraction'


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
  const { markChatStatus, pinChat, muteChat } = useUserChatInteractionsStore();
  console.log('ChatList render')

  

  const handleMarkChatStatus = async (id: number) => {
    try {
      await markChatStatus(id);
      console.log('markChatStatus called successfully');
    } catch (error) {
      console.error('Failed to change chat status:', error);
    }
  }

  const handlePinChat = async (id: number) => {
    try {
      await pinChat(id);
      console.log('pinChat called successfully');
    } catch (error) {
      console.error('Failed to change pin status:', error);
    }
  }

  const handleMuteChat = async (id: number, muteDuration?: number) => {
    try {
      await muteChat(id, muteDuration);
      console.log('muteChat called successfully');
    } catch (error) {
      console.error('Failed to mute chat:', error);
    }
  }

  const getOtherUser = (chat: UserChat) => {
    
    if (chat.chat.chatType === 'group') {
      return {
        name: chat.chat.groupName || 'Group Chat',
        avatar: chat.chat.groupAvatar
      }
    }
    
    const otherParticipant = chat.chat.participants.find(
      p => p.userId !== user.id
    );

    return {
      name: otherParticipant?.user.name || 'Unknown User',
      avatar: otherParticipant?.user.avatar
    }
  }
  

  return (
      <ul className="flex-1 overflow-y-auto">
      {chats
        .sort((a, b) => {
          const timeA = new Date(a.updatedAt).getTime();
          const timeB = new Date(b.updatedAt).getTime();
          
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          
          return timeB - timeA;
        })
        .map((chat, index) => (
          <ChatListItem
            key={`${String(chat.chatId)}-${String(index)}`}
            chat={chat}
            isSelected={selectedChatId === chat.chatId}
            onSelectChat={onSelectChat}
            onLeaveChat={onLeaveChat}
            onMarkChatStatus={handleMarkChatStatus}
            onPinChat={handlePinChat}
            onMuteChat={handleMuteChat}
            otherUser={getOtherUser(chat)}
          />
        ))}
      </ul>
  )
})