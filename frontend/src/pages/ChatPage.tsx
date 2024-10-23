import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatList } from '@/components/ChatList'
import { ChatWindow } from '@/components/ChatWindow'
import { MessageInput } from '@/components/MessageInput'
import { useAuth } from '@/context/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'
import { chats } from '@/constants/mockData'
import { Chat } from '@/types/chat'
import { NewMessagePopover } from '@/components/NewMessagePopover'

// Mock user search results
const mockUsers = [
  { id: 'user1', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'user2', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'user3', name: 'Carol Williams', email: 'carol@example.com' },
  { id: 'user4', name: 'David Brown', email: 'david@example.com' },
]

export const ChatPage: React.FC = () => {
  const { user, logout } = useAuth()
  const { messages, sendMessage } = useWebSocket()
  const [selectedChat, setSelectedChat] = useState<Chat>(chats[0])
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSendMessage = (content: string) => {
    if (user && selectedChat) {
      const newMessage = {
        id: Date.now(),
        sender: user.name,
        content,
        time: new Date().toLocaleTimeString(),
        isMine: true
      }
      sendMessage(newMessage)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleNewChat = (selectedUser: { id: string; name: string; email: string }) => {
    const newChat: Chat = {
      id: Date.now(),
      name: selectedUser.name,
      lastMessage: '',
      time: 'Now',
      unread: 0,
      avatar: '/placeholder.svg?height=40&width=40'
    }
    setSelectedChat(newChat)
    setIsNewMessageOpen(false)
  }

  const closeNewMessagePopover = () => {
    setIsNewMessageOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 bg-white border-r border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
            <div className="flex items-center space-x-2">
            <NewMessagePopover
              isOpen={isNewMessageOpen}
              onOpenChange={setIsNewMessageOpen}
              searchTerm={searchTerm}
              onSearch={handleSearch}
              onSelectUser={handleNewChat}
              onClose={closeNewMessagePopover}
              users={mockUsers}
            />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
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
