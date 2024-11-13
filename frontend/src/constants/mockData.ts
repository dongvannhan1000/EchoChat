import { Chat } from '@/types/chat'
import { User } from '@/types/user'

export const currentUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'joindoe@gmail.com',
  avatar: '/placeholder.svg?height=40&width=40'
}

export const chats: Chat[] = [
  { id: 1, name: 'Alice Johnson', lastMessage: 'See you tomorrow!', time: '10:30 AM', unread: 2, avatar: '/placeholder.svg?height=40&width=40' },
  { id: 2, name: 'Bob Smith', lastMessage: 'How about lunch?', time: 'Yesterday', unread: 0, avatar: '/placeholder.svg?height=40&width=40' },
  { id: 3, name: 'Carol Williams', lastMessage: 'The project is done.', time: 'Mon', unread: 1, avatar: '/placeholder.svg?height=40&width=40' },
  { id: 4, name: 'David Brown', lastMessage: 'Can you help me with...', time: '05/20', unread: 0, avatar: '/placeholder.svg?height=40&width=40' },
]