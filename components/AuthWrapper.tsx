'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Pages that don't require authentication
const publicPages = ['/', '/login', '/signup', '/about', '/contact', '/pricing', '/terms', '/privacy', '/help', '/blog']

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user && !publicPages.includes(pathname)) {
        router.push('/login')
      }
      if (user && (pathname === '/login' || pathname === '/signup')) {
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, pathname, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-sans">Loading IDStudio...</p>
        </div>
      </div>
    )
  }

  // Public pages — no dashboard shell
  if (publicPages.includes(pathname)) {
    return <>{children}</>
  }

  // Authenticated dashboard routes — wrap in DashboardLayout (sidebar + AI chat panel)
  if (user && pathname.startsWith('/dashboard')) {
    return <DashboardLayout>{children}</DashboardLayout>
  }

  // Other authenticated pages without dashboard shell
  if (user) {
    return <>{children}</>
  }

  return null
}
