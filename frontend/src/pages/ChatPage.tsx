import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ChatList from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { MessageInput } from '@/components/MessageInput'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/stores/useChat'
import { useUser } from '@/stores/useUser'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Chat, User } from '@/types/chat'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { debounce } from 'lodash';
import { useChatStore } from '@/stores/useChatV2'



export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const webSocketStore = useWebSocket();
  const { 
    messages, 
    sendMessage,
    fetchMessages,
    isLoading,
    hasMoreMessages,
    sendSystemMessage
  } = useChat();
  const {
    chats,
    currentChat,
    fetchUserChats,
    createChat,
    leaveChat
  } = useChatStore()

  const { users, fetchUsers } = useUser();

  


  // New state for Create New Message feature
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [chatSearchTerm, setChatSearchTerm] = useState('')
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  


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

  // const isConnected = useWebSocket(state => state.isConnected);

  // useEffect(() => {
  //   console.log('WebSocket connection status:', isConnected);
  // }, [isConnected]);

  useEffect(() => {
    if (isNewMessageOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isNewMessageOpen])

  useEffect(() => {
    if (isNewMessageOpen) {
      void fetchUsers('');
    }
    if (searchTerm) {
      const debouncedSearch = debounce(() => {
        void fetchUsers(searchTerm);
      }, 300);

      console.log(users)
      
      debouncedSearch();
      return () => {debouncedSearch.cancel()};
    }
  }, [searchTerm]);

  const handleSendMessage = (content: string) => {
    if (currentChat) {
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

    const chatData = await createChat([newUser.id]);
    console.log(chatData);
    setSelectedChatId(chatData.id);
  }

  const closeNewMessagePopover = () => {
    setIsNewMessageOpen(false)
    setSearchTerm('')
  }

  const handleEditMessage = async (messageId: number, content: string) => {
    try {
      await useChat.getState().editMessage(messageId, content);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    void (async () => {
      try {
        await useChat.getState().removeMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    })();
  };

  const handleLeaveChat = async (chatId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this chat?"
    );
    if (confirmed) {
      await sendSystemMessage(chatId, 'system', `${user!.name} left group`);
      await leaveChat(chatId);
    }
  };

  const [statusMessage, setStatusMessage] = useState('')

  console.log('ChatPage render')

  return (
    <div className="flex h-full bg-gray-100">
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
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
                      {users.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">
                          {searchTerm ? 'No user found.' : 'Start typing to search'}
                        </div>
                      ) : (
                        users.map(user => (
                          <button
                            key={user.id}
                            className="w-full text-left px-2 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            onClick={() => void handleNewChat({...user, id: Number(user.id)})}
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
              value={chatSearchTerm}
              onChange={(e) => {setChatSearchTerm(e.target.value)}}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
        <div className="p-4 border-b">
        <input
          type="text"
          value={statusMessage}
          onChange={(e) => {setStatusMessage(e.target.value)}}
          placeholder="Update your status..."
          className="w-full p-2 border rounded"
        />
        <button 
          // onClick={() => {onUpdateStatusMessage(statusMessage)}}
          className="mt-2 p-2 bg-blue-500 text-white rounded"
        >
          Update Status
        </button>
      </div>
        <ChatList
          chats={chats}
          onLeaveChat={handleLeaveChat}
          chatSearchTerm={chatSearchTerm}
          selectedChatId={selectedChatId}
          setSelectedChatId={setSelectedChatId}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow
          currentChat={currentChat}
          messages={messages}
          isLoading={isLoading['fetchMessages']}
          hasMore={hasMoreMessages} 
          onLoadMore={() => void handleLoadMore()}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
        <MessageInput 
          onSendMessage={handleSendMessage}
          currentChat={currentChat} 
          user={user}
        />
      </div>
    </div>
  )
}