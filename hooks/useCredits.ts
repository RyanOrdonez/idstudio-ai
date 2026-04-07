'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface CreditStatus {
  plan: 'free' | 'starter' | 'pro' | 'studio'
  planLabel: string
  weeklyLimit: number
  creditsUsed: number
  creditsRemaining: number
  unlimited: boolean
}

export interface UseCreditsReturn {
  creditStatus: CreditStatus | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Wraps GET /api/credits. Used by the settings billing tab to show
 * weekly credit usage alongside plan details. The AIChatPanel has its
 * own copy of this logic — we don't share because that component is
 * already working and refactoring it is outside Task #1 scope.
 */
export function useCredits(): UseCreditsReturn {
  const { user } = useAuth()
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) {
      setCreditStatus(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch('/api/credits')
      if (!res.ok) {
        throw new Error(`Failed to load credits (${res.status})`)
      }
      const data = await res.json()
      setCreditStatus(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setCreditStatus(null)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { creditStatus, isLoading, error, refetch }
}
