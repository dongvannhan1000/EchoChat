import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Chat } from '@/types/chat'

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat
  onSelectChat: (chat: Chat) => void
}

export const ChatList: React.FC<ChatListProps> = ({ chats, selectedChat, onSelectChat }) => {
  return (
    <ul className="overflow-y-auto h-[calc(100vh-120px)]">
      {chats.map((chat) => (
        <li
          key={chat.id}
          className={`p-4 hover:bg-gray-100 cursor-pointer ${
            selectedChat.id === chat.id ? 'bg-gray-100' : ''
          }`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={chat.avatar} alt={chat.name} />
              <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">{chat.name}</h2>
                <span className="text-sm text-gray-500">{chat.time}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {chat.unread}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}