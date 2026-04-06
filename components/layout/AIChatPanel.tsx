'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Mail,
  Palette,
  DollarSign,
  UserCheck,
  ShoppingBag,
  Loader2,
  Zap,
  Crown,
  ArrowUpCircle,
} from 'lucide-react'

const categories = [
  { value: 'general', label: 'General', icon: Sparkles },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'moodboard', label: 'Mood Board', icon: Palette },
  { value: 'budget', label: 'Budget', icon: DollarSign },
  { value: 'follow-up', label: 'Follow-up', icon: UserCheck },
  { value: 'sourcing', label: 'Sourcing', icon: ShoppingBag },
]

const modelOptions = [
  { value: 'haiku' as const, label: 'Haiku', credits: 1, icon: Zap, description: 'Fast — emails, quick answers' },
  { value: 'sonnet' as const, label: 'Sonnet', credits: 3, icon: Sparkles, description: 'Balanced — proposals, detailed work' },
  { value: 'opus' as const, label: 'Opus', credits: 5, icon: Crown, description: 'Powerful — complex documents' },
]

interface AIChatPanelProps {
  width?: number
}

export default function AIChatPanel({ width = 420 }: AIChatPanelProps) {
  const {
    isChatOpen,
    toggleChat,
    chatMessages,
    chatCategory,
    chatModel,
    setChatCategory,
    setChatModel,
    addChatMessage,
    isAiLoading,
    setAiLoading,
    creditStatus,
    setCreditStatus,
  } = useAppStore()

  const { user } = useAuth()
  const [input, setInput] = useState('')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  // Fetch credit status on mount and when user changes
  useEffect(() => {
    if (!user) return
    const fetchCredits = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const res = await fetch('/api/credits', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCreditStatus(data)
        } else {
          console.error('Failed to fetch credits:', res.status)
          toast.error('Unable to load credit balance')
        }
      } catch (error) {
        console.error('Credit fetch error:', error)
        toast.error('Unable to load credit balance')
      }
    }
    fetchCredits()
  }, [user, setCreditStatus])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Close model menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setShowModelMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedModel = modelOptions.find((m) => m.value === chatModel) || modelOptions[0]
  const isOutOfCredits = creditStatus && !creditStatus.unlimited && creditStatus.creditsRemaining < selectedModel.credits

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isAiLoading || isOutOfCredits) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: trimmed,
      category: chatCategory,
      timestamp: new Date(),
    }

    addChatMessage(userMessage)
    setInput('')
    setAiLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const conversationHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...conversationHistory, { role: 'user', content: trimmed }],
          category: chatCategory,
          model: chatModel,
        }),
      })

      const data = await response.json()

      if (data.error === 'out_of_credits') {
        if (data.creditStatus) setCreditStatus(data.creditStatus)
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚡ You\'ve used all your weekly credits. Upgrade your plan for more AI access.',
          timestamp: new Date(),
        })
      } else if (data.error) {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error}`,
          timestamp: new Date(),
        })
      } else {
        if (data.creditStatus) setCreditStatus(data.creditStatus)
        // Show tool actions if any (e.g. "Created client: John Smith")
        if (data.toolActions && data.toolActions.length > 0) {
          const actionSummary = data.toolActions
            .map((a: { tool: string; result: string }) => `✓ ${a.result}`)
            .join('\n')
          addChatMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: actionSummary,
            timestamp: new Date(),
          })
        }
        addChatMessage({
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: data.message,
          category: chatCategory,
          timestamp: new Date(),
        })
      }
    } catch {
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I was unable to connect. Please try again.',
        timestamp: new Date(),
      })
    } finally {
      setAiLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleModelKeyDown = (e: React.KeyboardEvent) => {
    if (!showModelMenu) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setShowModelMenu(true)
      }
      return
    }
    const currentIndex = modelOptions.findIndex((m) => m.value === chatModel)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = modelOptions[Math.min(currentIndex + 1, modelOptions.length - 1)]
      setChatModel(next.value)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = modelOptions[Math.max(currentIndex - 1, 0)]
      setChatModel(prev.value)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setShowModelMenu(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowModelMenu(false)
    }
  }

  // Collapsed toggle button
  if (!isChatOpen) {
    return (
      <button
        onClick={toggleChat}
        aria-label="Open AI Assistant"
        className="fixed right-0 top-1/2 z-30 -translate-y-1/2 flex items-center gap-1 rounded-l-xl border border-r-0 border-border bg-card px-2 py-4 shadow-soft-md transition-all hover:bg-secondary"
      >
        <ChevronRight className="h-4 w-4 rotate-180 text-primary" />
        <MessageSquare className="h-5 w-5 text-primary" />
      </button>
    )
  }

  const creditPercent = creditStatus && !creditStatus.unlimited
    ? Math.max(0, Math.min(100, (creditStatus.creditsRemaining / creditStatus.weeklyLimit) * 100))
    : 100

  return (
    <aside
      aria-label="AI Assistant chat panel"
      className="flex h-full shrink-0 flex-col border-l border-border bg-card"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-sans">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          aria-label="Close AI Assistant"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Credit bar + Model selector row */}
      <div className="px-4 py-2.5 space-y-2">
        {/* Credits display */}
        {creditStatus && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {creditStatus.unlimited ? (
                <span className="text-primary font-medium">Unlimited credits</span>
              ) : (
                <>
                  <span className="font-medium text-foreground">{creditStatus.creditsRemaining}</span>
                  <span>/{creditStatus.weeklyLimit} credits this week</span>
                </>
              )}
            </span>
            <Badge variant="warm" className="text-[10px] px-1.5 py-0">
              {creditStatus.planLabel}
            </Badge>
          </div>
        )}
        {creditStatus && !creditStatus.unlimited && (
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                creditPercent > 50 ? 'bg-primary' : creditPercent > 20 ? 'bg-yellow-500' : 'bg-destructive'
              )}
              style={{ width: `${creditPercent}%` }}
            />
          </div>
        )}

        {/* Model selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            onKeyDown={handleModelKeyDown}
            aria-expanded={showModelMenu}
            aria-haspopup="listbox"
            aria-label={`AI model: ${selectedModel.label}`}
            className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-1.5 text-xs hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <selectedModel.icon className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{selectedModel.label}</span>
              <span className="text-muted-foreground">· {selectedModel.credits} credit{selectedModel.credits > 1 ? 's' : ''}/msg</span>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', showModelMenu && 'rotate-180')} />
          </button>

          {showModelMenu && (
            <div role="listbox" aria-label="Select AI model" className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-soft-lg overflow-hidden">
              {modelOptions.map((m) => {
                const Icon = m.icon
                const canAfford = creditStatus?.unlimited || !creditStatus || creditStatus.creditsRemaining >= m.credits
                return (
                  <button
                    key={m.value}
                    role="option"
                    aria-selected={chatModel === m.value}
                    onClick={() => { setChatModel(m.value); setShowModelMenu(false) }}
                    disabled={!canAfford}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      chatModel === m.value ? 'bg-primary/5' : 'hover:bg-secondary/50',
                      !canAfford && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', chatModel === m.value ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground">{m.credits} credit{m.credits > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                    </div>
                    {chatModel === m.value && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Category selector */}
      <div role="tablist" aria-label="Chat category" className="flex flex-wrap gap-1.5 px-4 py-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = chatCategory === cat.value
          return (
            <button
              key={cat.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setChatCategory(cat.value)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-warm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          )
        })}
      </div>

      <Separator />

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="px-4 py-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-foreground font-sans">
              How can I help?
            </h4>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Ask me to draft emails, create mood boards, plan budgets, source products, or anything else for your design business.
            </p>
          </div>
        ) : (
          <div role="log" aria-label="Chat messages" aria-live="polite" className="space-y-4 w-full">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex w-full',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md max-w-[80%]'
                      : 'bg-secondary text-secondary-foreground rounded-bl-md max-w-[90%]'
                  )}
                  style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                >
                  <p className="whitespace-pre-wrap" style={{ overflowWrap: 'break-word' }}>{msg.content}</p>
                  {msg.category && msg.role === 'assistant' && (
                    <Badge variant="warm" className="mt-2 text-[10px]">
                      {msg.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground rounded-bl-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Upgrade banner when out of credits */}
      {isOutOfCredits && (
        <div className="px-4 py-3 bg-primary/5 border-t border-primary/10">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">Weekly credits used up</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Upgrade for more credits and access to powerful models.
          </p>
          <Button size="sm" className="w-full h-7 text-xs" onClick={() => window.location.href = '/dashboard/settings'}>
            View Plans
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // Auto-expand height
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder={isOutOfCredits ? 'No credits remaining...' : 'Ask your AI assistant...'}
            aria-label="Message to AI assistant"
            rows={1}
            disabled={!!isOutOfCredits}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            style={{ minHeight: '36px', maxHeight: '200px', overflow: 'auto' }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isAiLoading || !!isOutOfCredits}
            aria-label="Send message"
            className="h-8 w-8 shrink-0 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
