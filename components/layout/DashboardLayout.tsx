'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Sidebar from './Sidebar'
import AIChatPanel from './AIChatPanel'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const MIN_CHAT_WIDTH = 340
const MAX_CHAT_WIDTH = 700
const DEFAULT_CHAT_WIDTH = 420

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarCollapsed, isChatOpen } = useAppStore()
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [chatWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      const newWidth = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, startWidth.current + delta))
      setChatWidth(newWidth)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-300',
          isSidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        <div className="flex h-full">
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {children}
          </div>

          {/* Drag handle */}
          {isChatOpen && (
            <div
              onMouseDown={handleMouseDown}
              className="w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-primary/20 active:bg-primary/30 transition-all shrink-0 relative group"
              title="Drag to resize"
            >
              <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
          )}

          {/* Right AI Chat Panel — persistent */}
          <AIChatPanel width={chatWidth} />
        </div>
      </main>
    </div>
  )
}
