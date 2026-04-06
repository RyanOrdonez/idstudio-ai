import { create } from 'zustand'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  category?: string
  timestamp: Date
}

interface CreditStatus {
  plan: string
  planLabel: string
  weeklyLimit: number
  creditsUsed: number
  creditsRemaining: number
  unlimited: boolean
}

export type CanvasContent =
  | { type: 'document'; title: string; html: string }
  | { type: 'email'; to?: string; subject?: string; body?: string }
  | { type: 'mood_board'; title: string; description?: string; imageUrl?: string; revisedPrompt?: string }
  | { type: 'rendering'; imageUrl?: string }
  | { type: 'file_viewer'; fileName: string; fileUrl: string; fileType?: string }

interface AppState {
  // AI Chat Panel
  isChatOpen: boolean
  chatMessages: ChatMessage[]
  chatCategory: string
  chatModel: 'haiku' | 'sonnet' | 'opus'
  isAiLoading: boolean
  creditStatus: CreditStatus | null
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
  setChatCategory: (category: string) => void
  setChatModel: (model: 'haiku' | 'sonnet' | 'opus') => void
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void
  setAiLoading: (loading: boolean) => void
  setCreditStatus: (status: CreditStatus) => void

  // Active view / navigation
  activeView: string
  setActiveView: (view: string) => void

  // Sidebar
  isSidebarCollapsed: boolean
  toggleSidebar: () => void

  // Work Canvas
  canvasContent: CanvasContent | null
  setCanvasContent: (content: CanvasContent) => void
  clearCanvas: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // AI Chat Panel
  isChatOpen: true,
  chatMessages: [],
  chatCategory: 'general',
  chatModel: 'haiku',
  isAiLoading: false,
  creditStatus: null,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),
  setChatCategory: (category) => set({ chatCategory: category }),
  setChatModel: (model) => set({ chatModel: model }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  setCreditStatus: (status) => set({ creditStatus: status }),

  // Active view
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  // Sidebar
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Work Canvas
  canvasContent: null,
  setCanvasContent: (content) => set({ canvasContent: content }),
  clearCanvas: () => set({ canvasContent: null }),
}))
