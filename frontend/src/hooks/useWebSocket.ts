import { useState, useEffect, useCallback } from 'react'
import { Message } from '@/types/message'

// Mock WebSocket (in a real app, you'd use a real WebSocket connection)
const mockWebSocket = {
  send: (message: string) => {
    console.log('Sending message:', message)
    // Simulate receiving a message after a short delay
    setTimeout(() => {
      const response: Message = {
        id: Date.now(),
        sender: 'Alice Johnson',
        content: 'Thanks for your message!',
        time: new Date().toLocaleTimeString(),
        isMine: false
      }
      mockWebSocket.onmessage({ data: JSON.stringify(response) })
    }, 1000)
  },
  onmessage: (event: { data: string }) => {
    console.log('Received message:', event.data);
  }
}

export const useWebSocket = () => {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    mockWebSocket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages((prevMessages) => [...prevMessages, message])
    }

    return () => {
      mockWebSocket.onmessage = () => {}
    }
  }, [])

  const sendMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message])
    mockWebSocket.send(JSON.stringify(message))
  }, [])

  return { messages, sendMessage }
}