'use client'

interface Message {
  id: string
  role?: 'user' | 'assistant'
  sender?: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = (message.sender || message.role) === 'user'
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
        }`}>
          {isUser ? 'You' : '🤖'}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
          }`}>
            <div className="text-sm leading-relaxed">
              {formatMessageContent(message.content)}
            </div>
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs text-neutral-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}
