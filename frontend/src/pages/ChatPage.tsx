import React, { useState, useEffect, useRef } from 'react'
import { Search, LogOut, Plus, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatList } from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { MessageInput } from '@/components/MessageInput'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/stores/useChat'
import { useUser } from '@/hooks/useUser'
import { useWebSocket } from '@/hooks/useWebSocket'
import { chats } from '@/constants/mockData'
import { Chat } from '@/types/chat'
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
  const { currentChat, messages, sendMessage } = useChat();
  const { users } = useUser();
  const [selectedChat, setSelectedChat] = useState<Chat>(chats[0])

  // New state for Create New Message feature
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState(mockUsers)
  const searchInputRef = useRef<HTMLInputElement>(null)

  

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
    if (user) {
      const newMessage = {
        id: Date.now(),
        sender: user.name,
        content,
        time: new Date().toLocaleTimeString(),
        isMine: true
      }
      sendMessage(selectedChat.id, newMessage)
    }
  }

  const handleNewChat = (newUser: { id: string; name: string; email: string }) => {
    console.log('Starting new chat with:', newUser)
    setIsNewMessageOpen(false)
    setSearchTerm('')
    // Here you would typically start a new chat or navigate to a new chat page
    // For now, let's create a new chat and set it as selected
    const newChat: Chat = {
      id: Date.now(),
      name: newUser.name,
      lastMessage: '',
      time: 'Now',
      unread: 0,
      avatar: '/placeholder.svg?height=40&width=40'
    }
    setSelectedChat(newChat)
  }

  const closeNewMessagePopover = () => {
    setIsNewMessageOpen(false)
    setSearchTerm('')
  }

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
                            onClick={() => {handleNewChat(user)}}
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
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow
          selectedChat={selectedChat}
          messages={messages}
        />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}