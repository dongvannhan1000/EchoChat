import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserChat } from '@/types/chat'

interface ChatListProps {
  chats: UserChat[]
  selectedChatId: number | null
  onSelectChat: (chatId: number) => void
}

export default function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  return (
    <ul className="overflow-y-auto h-[calc(100vh-120px)]">
      {chats.map((chat, index) => {
        console.log('Chat ID:', chat.chatId);
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
              <AvatarImage src={chat.chat.groupAvatar || chat.chat.participants[0]?.user.avatar} alt={chat.chat.groupName || chat.chat.participants[0]?.user.name} />
              <AvatarFallback>{(chat.chat.groupName || chat.chat.participants[0]?.user.name || '').split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">
                  {chat.chat.groupName || chat.chat.participants[0]?.user.name}
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
}