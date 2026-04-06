'use client'

import { useState, useRef, useEffect } from 'react'
import { PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Conversation {
  id: string
  title: string
  lastMessage: string
  timestamp: string
}

// Dummy conversation data
const dummyConversations: Conversation[] = [
  {
    id: '1',
    title: 'Living Room Design Ideas',
    lastMessage: 'What are some modern living room trends?',
    timestamp: '2 hours ago'
  },
  {
    id: '2', 
    title: 'Kitchen Renovation Budget',
    lastMessage: 'Help me estimate costs for a kitchen remodel',
    timestamp: '1 day ago'
  },
  {
    id: '3',
    title: 'Bedroom Color Schemes',
    lastMessage: 'Suggest calming bedroom colors',
    timestamp: '3 days ago'
  },
  {
    id: '4',
    title: 'Client Presentation Tips',
    lastMessage: 'How to present design concepts effectively?',
    timestamp: '1 week ago'
  }
]

export default function ConversationsSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [conversations] = useState<Conversation[]>(dummyConversations)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleRenameClick = (id: string, currentTitle: string) => {
    setEditingTitle(id)
    setNewTitle(currentTitle)
    setActiveDropdown(null)
  }
  
  const handleRenameSubmit = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // In a real app, you would update the conversation title in your backend
    console.log(`Renaming conversation ${id} to: ${newTitle}`)
    
    // For now, just close the editing mode
    setEditingTitle(null)
  }

  return (
    <div className="flex flex-col h-full" style={{ width: '240px' }}>
      {/* New Chat Button */}
      <div className="p-3">
        <Link
          href="/assistant"
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Start new chat"
        >
          <PlusIcon className="w-4 h-4 mr-3" />
          New chat
        </Link>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-auto">
        <div className="px-3 space-y-1">
          {conversations.map((conversation) => {
            const isActive = pathname === `/assistant/conversations/${conversation.id}`
            const isEditing = editingTitle === conversation.id
            
            return (
              <div key={conversation.id} className="relative group">
                {isEditing ? (
                  <form onSubmit={(e) => handleRenameSubmit(conversation.id, e)} className="p-3">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full text-sm border-b border-blue-400 bg-transparent py-1 px-0 focus:outline-none focus:border-blue-600"
                      autoFocus
                      onBlur={() => handleRenameSubmit(conversation.id)}
                    />
                  </form>
                ) : (
                  <Link
                    href={`/assistant/conversations/${conversation.id}`}
                    className={`
                      block p-3 rounded-lg transition-colors cursor-pointer
                      ${isActive 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {conversation.lastMessage}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.timestamp}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}
                
                {/* Three-dot menu (only visible on hover) */}
                {!isEditing && (
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === conversation.id ? null : conversation.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Chat options"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                )}
                
                {/* Dropdown menu */}
                {activeDropdown === conversation.id && (
                  <div 
                    ref={dropdownRef}
                    className="absolute right-0 top-10 z-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                  >
                    <button
                      onClick={() => handleRenameClick(conversation.id, conversation.title)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Rename
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
