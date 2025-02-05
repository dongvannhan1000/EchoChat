import { UserChat } from '@/types/chat'
import { useCallback, useEffect } from "react"
import { useAuth } from '@/hooks/useAuth'
import { ChatListItem } from './ChatListItem'
import { useUserChatInteractionsStore } from '@/stores/useInteraction'
import { useChatStore } from '@/stores/useChatV2'
import { useChat } from '@/stores/useChat'


interface ChatListProps {
  chats: UserChat[]
  onLeaveChat: (chatId: number) => Promise<void>
  chatSearchTerm: string
  selectedChatId: number | null
  setSelectedChatId: (chatId: number) => void
}

export default function ChatList({ 
  chats, 
  onLeaveChat,
  chatSearchTerm,
  selectedChatId,
  setSelectedChatId}: ChatListProps) {
  console.log('SearchTerm:', chatSearchTerm);
  const { user } = useAuth();
  const { markChatStatus, pinChat, muteChat } = useUserChatInteractionsStore();
  console.log('ChatList render')

  const { currentChat, fetchChatDetails } = useChatStore()
  const { fetchMessages } = useChat();

  



  const handleSelectChat = useCallback((chatId: number, id: number) => {
    if (chatId) {
      setSelectedChatId(chatId);
      void markChatStatus(id, true);
    }
    
  }, [selectedChatId]);
  
  useEffect(() => {
    console.log('useEffect in ChatList')
    if (selectedChatId && (!currentChat || currentChat.id !== selectedChatId) && chats.some(chat => chat.chatId === selectedChatId)
    ) {
      void (async () => {
        try {
          await fetchChatDetails(selectedChatId);
          await fetchMessages(selectedChatId, true);
        } catch (error) {
          console.error('Error loading chat:', error);
        }
      })();
    }
  }, [selectedChatId, currentChat?.id]);

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
      p => p.userId !== user?.id
    );

    return {
      id: otherParticipant?.user.id,
      name: otherParticipant?.user.name || 'Unknown User',
      avatar: otherParticipant?.user.avatar,
      statusMessage: otherParticipant?.user.statusMessage
    }
  }

  

  return (
      <ul className="flex-1 overflow-y-auto">
      {chats
        .filter(chat => {
          const otherUserName = getOtherUser(chat).name;
          return otherUserName && otherUserName.toLowerCase().includes(chatSearchTerm.toLowerCase());
        })
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
            onSelectChat={handleSelectChat}
            onLeaveChat={onLeaveChat}
            onMarkChatStatus={handleMarkChatStatus}
            onPinChat={handlePinChat}
            onMuteChat={handleMuteChat}
            otherUser={getOtherUser(chat)}
          />
        ))}
      </ul>
  )
}