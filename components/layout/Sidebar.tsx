'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Palette,
  Receipt,
  ShoppingBag,
  BarChart3,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/files', label: 'Files', icon: FileText },
  { href: '/dashboard/mood-boards', label: 'Mood Boards', icon: Palette },
  { href: '/dashboard/sourcing', label: 'Sourcing', icon: ShoppingBag },
  { href: '/dashboard/financials', label: 'Financials', icon: Receipt },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

const bottomItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isSidebarCollapsed, toggleSidebar } = useAppStore()

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.name?.[0] || 'U'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isSidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!isSidebarCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">ID</span>
            </div>
            <span className="font-serif text-lg font-semibold text-sidebar-foreground">
              IDStudio
            </span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="bg-sidebar-foreground/10" />

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent/20 text-sidebar-accent'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent/20 text-sidebar-accent'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        <Separator className="my-3 bg-sidebar-foreground/10" />

        {/* User section */}
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent/30 text-sidebar-accent text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.fullName || user?.name || 'User'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">
                {user?.email || ''}
              </p>
            </div>
          )}
          {!isSidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
