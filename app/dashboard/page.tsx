'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FolderKanban,
  Users,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    totalClients: 0,
    totalFiles: 0,
    recentActivity: [] as Array<{
      id: string | number;
      type: string;
      message: string;
      timestamp: string;
      createdAt: string;
    }>
  })

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else {
        return 'Just now'
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return 'Unknown'
    }
  }

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    
    if (user) {
      try {
        // Fetch real data from database with proper error handling
        const [projectsRes, clientsRes, filesRes] = await Promise.all([
          supabase
            .from('projects')
            .select('id, project_name, created_at')
            .or('archived.is.null,archived.eq.false')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('clients')
            .select('id, name, created_at')
            .or('archived.is.null,archived.eq.false')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('files')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5)
        ])

        // Handle potential errors gracefully
        const projects = projectsRes.error ? [] : (projectsRes.data || [])
        const clients = clientsRes.error ? [] : (clientsRes.data || [])
        const files = filesRes.error ? [] : (filesRes.data || [])

        // Notify user of fetch errors
        if (projectsRes.error) toast.error('Failed to load projects')
        if (clientsRes.error) toast.error('Failed to load clients')
        if (filesRes.error) toast.error('Failed to load files')

        // Create recent activity from all items, sorted by raw date
        const recentActivity = [
          ...projects.map(p => ({
            id: `project-${p.id}`,
            type: 'project',
            message: `Created project "${p.project_name || 'Untitled'}"`,
            timestamp: formatTimestamp(p.created_at),
            createdAt: p.created_at,
          })),
          ...clients.map(c => ({
            id: `client-${c.id}`,
            type: 'client',
            message: `Added client "${c.name || 'Unnamed'}"`,
            timestamp: formatTimestamp(c.created_at),
            createdAt: c.created_at,
          })),
          ...files.map(f => ({
            id: `file-${f.id}`,
            type: 'file',
            message: `Uploaded "${f.name || 'Untitled file'}"`,
            timestamp: formatTimestamp(f.created_at),
            createdAt: f.created_at,
          }))
        ]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setDashboardStats({
          totalProjects: projects.length,
          totalClients: clients.length,
          totalFiles: files.length,
          recentActivity
        })

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fallback to empty data on error
        setDashboardStats({
          totalProjects: 0,
          totalClients: 0,
          totalFiles: 0,
          recentActivity: []
        })
      }
    } else {
      // Sample data for demo (unauthenticated users)
      setDashboardStats({
        totalProjects: 1,
        totalClients: 1,
        totalFiles: 1,
        recentActivity: [
          {
            id: 'demo-1',
            type: 'project',
            message: 'Created project "Modern Living Room Redesign"',
            timestamp: '2 hours ago',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-2',
            type: 'client',
            message: 'Added client "Sarah Johnson"',
            timestamp: '3 hours ago',
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'demo-3',
            type: 'file',
            message: 'Uploaded "Living Room Floor Plan.pdf"',
            timestamp: '4 hours ago',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          }
        ]
      })
    }
    
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const statCards = [
    {
      label: 'Active Projects',
      value: dashboardStats.totalProjects,
      icon: FolderKanban,
      href: '/dashboard/projects',
      color: 'text-warm-700',
      bg: 'bg-warm-100',
    },
    {
      label: 'Clients',
      value: dashboardStats.totalClients,
      icon: Users,
      href: '/dashboard/clients',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Files',
      value: dashboardStats.totalFiles,
      icon: FileText,
      href: '/dashboard/files',
      color: 'text-violet-700',
      bg: 'bg-violet-50',
    },
  ]

  const activityIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderKanban className="h-4 w-4 text-warm-700" />
      case 'client': return <Users className="h-4 w-4 text-emerald-700" />
      default: return <FileText className="h-4 w-4 text-violet-700" />
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your design business.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex gap-3 mb-8"
            >
              <Link href="/dashboard/projects">
                <Button variant="default" className="gap-2">
                  <Plus className="h-4 w-4" /> New Project
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" /> Add Client
                </Button>
              </Link>
              <Link href="/dashboard/mood-boards">
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Create Mood Board
                </Button>
              </Link>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
            >
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Link key={stat.label} href={stat.href}>
                    <Card className="hover:shadow-soft-md transition-shadow cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-bold text-foreground mt-1 font-sans">{stat.value}</p>
                          </div>
                          <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            <Icon className={`h-6 w-6 ${stat.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <Badge variant="secondary" className="font-sans">
                    <Clock className="h-3 w-3 mr-1" />
                    {dashboardStats.recentActivity.length} items
                  </Badge>
                </CardHeader>
                <CardContent>
                  {dashboardStats.recentActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No recent activity yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start by creating a project or adding a client.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardStats.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 group">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            {activityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{activity.timestamp}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
