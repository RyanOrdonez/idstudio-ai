'use client'

import { AuthProvider } from '@/contexts/AuthProvider'
import AuthWrapper from '@/components/AuthWrapper'
import { ReactNode } from 'react'

export default function ClientSideLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        {children}
      </AuthWrapper>
    </AuthProvider>
  )
}
