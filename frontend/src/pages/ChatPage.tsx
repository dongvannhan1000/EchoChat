import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, X, Send, MoreHorizontal } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MessageType } from '@/types/chat'



export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const webSocketStore = useWebSocket();
  const {
    messages,
    sendMessage,
    fetchMessages,
    isLoading,
    hasMoreMessages,
    sendSystemMessage,
    updateStatusMessage
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
    let mounted = true;

    const initializeWebSocket = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (token && mounted && !webSocketStore.isInitialized) {
        try {
          console.log('ChatPage: Initializing WebSocket with access token');
          await webSocketStore.initializeSocket(token);
        } catch (error) {
          console.error('ChatPage: WebSocket initialization failed:', error);
        }
      } else if (!token) {
        console.warn('ChatPage: No access token found for WebSocket initialization');
      }
    };

    void initializeWebSocket();
    void fetchUserChats();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleTokenChange = () => {
      const token = sessionStorage.getItem('accessToken');
      if (token && !webSocketStore.isInitialized) {
        void webSocketStore.initializeSocket(token);
      } else if (!token && webSocketStore.isConnected) {
        void webSocketStore.disconnect();
      }
    };

    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken') {
        handleTokenChange();
      }
    });

    return () => {
      window.removeEventListener('storage', handleTokenChange);
    };
  }, []);

  useEffect(() => {
    if (webSocketStore.isConnected) {
      console.log('ChatPage: WebSocket connected');
    } else {
      console.log('ChatPage: WebSocket disconnected');
    }
  }, [webSocketStore.isConnected]);

  useEffect(() => {
    return () => {
      if (webSocketStore.isConnected) {
        console.log('ChatPage: Disconnecting WebSocket on unmount');
        void webSocketStore.disconnect();
      }
    };
  }, []);

  // const isConnected = useWebSocket(state => state.isConnected);

  // useEffect(() => {
  //   console.log('WebSocket connection status:', isConnected);
  // }, [isConnected]);

  useEffect(() => {
    if (user && !webSocketStore.isConnected) {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        void webSocketStore.initializeSocket(token);
      }
    } else if (!user && webSocketStore.isConnected) {
      void webSocketStore.disconnect();
    }
  }, [user]);

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

      
      debouncedSearch();
      return () => {debouncedSearch.cancel()};
    }
  }, [searchTerm]);

  const handleSendMessage = async (content: string, type: MessageType, imageFileKey?: string, replyToId?: number) => {
    if (currentChat) {
      return await sendMessage(currentChat.id, content, type, imageFileKey, replyToId);
    }
    return Promise.reject(new Error('No chat selected'));
  }

  const handleLoadMore = async () => {
    if (currentChat) {
      await fetchMessages(currentChat.id, false);
    }
  };

  const handleNewChat = async (newUser: User) => {
    setIsNewMessageOpen(false)
    setSearchTerm('')

    const chatData = await createChat([newUser.id], 'private');
    useChatStore.getState().setCurrentChat(chatData as Chat)
  }

  const handleNewGroupChat = async (newUser: User) => {
    setIsNewMessageOpen(false)
    setSearchTerm('')

    const chatData = await createChat([newUser.id], 'group', `${user!.name}, ${newUser.name} Group`);
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
                          <div key={user.id} className="w-full border-b last:border-b-0">
                            <div className="px-3 py-2 hover:bg-gray-50 flex items-center justify-between group">
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => void handleNewChat({...user, id: Number(user.id)})}
                                  >
                                    Start Chat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => void handleNewGroupChat({...user, id: Number(user.id)})}
                                  >
                                    Create Group Chat
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
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
        <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => {setStatusMessage(e.target.value)}}
                  placeholder="What's on your mind?"
                  className="w-full pl-4 pr-12 py-3 text-base bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition"
                />
                <Button 
                  onClick={() => void updateStatusMessage(statusMessage)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center p-0 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
          messages={messages}
          isLoading={isLoading['fetchMessages']}
          hasMore={hasMoreMessages} 
          onLoadMore={() => void handleLoadMore()}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
        <MessageInput 
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}