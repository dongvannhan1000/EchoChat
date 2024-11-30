import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ChatList from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { MessageInput } from '@/components/MessageInput'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/stores/useChat'
import { useUser } from '@/hooks/useUser'
import { useWebSocket } from '@/hooks/useWebSocket'
import { User } from '@/types/chat'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Mock user data for new message feature
const mockUsers = [
  { id: 'user1', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'user2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'user3', name: 'Carol Williams', email: 'carol@example.com' },
  { id: 'user4', name: 'Nhan Dong', email: 'david@example.com' },
]

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const webSocketStore = useWebSocket();
  const { 
    chats, 
    currentChat, 
    messages, 
    sendMessage, 
    fetchUserChats, 
    fetchChatDetails, 
    fetchMessages,
    createChat,
    isLoading,
    hasMoreMessages
  } = useChat();
  const { users } = useUser();

  

  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  // New state for Create New Message feature
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState(mockUsers)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectedChatId) {
      void (async () => {
        try {
          await fetchChatDetails(selectedChatId);
          await fetchMessages(selectedChatId, true);
        } catch (error) {
          console.error('Error loading chat:', error);
        }
      })();
    }
  }, [selectedChatId]);

  const handleSelectChat = (chatId: number) => {
    setSelectedChatId(chatId);
  };

  useEffect(() => {
    // Assuming you have the token stored somewhere
    let mounted = true;

    const initializeWebSocket = async () => {
      const token = localStorage.getItem('token');
      if (token && mounted) {
        console.log('Initializing WebSocket connection...');
        await webSocketStore.connect(token);
      }
    };

    void initializeWebSocket();
    void fetchUserChats();

    return () => {
      mounted = false;
      console.log('Cleaning up WebSocket connection...');
      if (webSocketStore.socket) {
        void webSocketStore.disconnect();
      }
    };
  }, []);

  const isConnected = useWebSocket(state => state.isConnected);

  useEffect(() => {
    console.log('WebSocket connection status:', isConnected);
  }, [isConnected]);

  useEffect(() => {
    if (isNewMessageOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isNewMessageOpen])

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase()
    const filtered = mockUsers.filter(user => 
      user.name.toLowerCase().includes(lowercasedFilter) ||
      user.email.toLowerCase().includes(lowercasedFilter)
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleSendMessage = (content: string) => {
    if (user && currentChat) {
      void sendMessage(currentChat.id, content)
    }
  }

  const handleLoadMore = async () => {
    if (currentChat) {
      await fetchMessages(currentChat.id, false);
    }
  };

  const handleNewChat = async (newUser: User) => {
    console.log('Starting new chat with:', newUser)
    setIsNewMessageOpen(false)
    setSearchTerm('')
    await createChat([newUser.id]);
    await fetchUserChats();
  }

  const closeNewMessagePopover = () => {
    setIsNewMessageOpen(false)
    setSearchTerm('')
  }

  const handleEditMessage = async (messageId: number, newContent: string) => {
    try {
      await useChat.getState().editMessage(messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    void (async () => {
      try {
        await useChat.getState().deleteMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    })();
  };

  // const handlePinMessage = async (messageId: number) => {
  //   try {
  //     // Implement pinMessage function in useChat store
  //     await useChat.getState().pinMessage(messageId);
  //   } catch (error) {
  //     console.error('Failed to pin message:', error);
  //   }
  // };

  console.log('ChatPage render')

  return (
    <div className="flex h-full bg-gray-100">
      <div className="w-1/4 bg-white border-r border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
            <div className="flex items-center space-x-2">
              <Popover open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between p-2 border-b">
                      <h2 className="text-sm font-semibold">New Message</h2>
                      <Button variant="ghost" size="icon" onClick={closeNewMessagePopover}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2">
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search user..."
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value)}}
                        className="w-full"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No user found.</div>
                      ) : (
                        filteredUsers.map(user => (
                          <button
                            key={user.id}
                            className="w-full text-left px-2 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => {void handleNewChat({...user, id: Number(user.id) })}}
                          >
                            <div>{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search chats..."
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
        <ChatList
          chats={chats}
          selectedChatId={currentChat?.id ?? null}
          onSelectChat={handleSelectChat}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow
          currentChat={currentChat}
          messages={messages}
          isLoading={isLoading['fetchMessages']}
          hasMore={hasMoreMessages} 
          onLoadMore={() => void handleLoadMore()}
          onEditMessage={void handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          // onPinMessage={() => handlePinMessage}
        />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}