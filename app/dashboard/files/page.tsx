'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  FolderOpen,
  Loader2,
} from 'lucide-react'

interface FileRecord {
  id: string
  name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  mime_type: string | null
  description: string | null
  tags: string[] | null
  project_id: string | null
  created_at?: string
}

interface Project {
  id: string
  project_name: string
}

export default function DashboardFiles() {
  const { user } = useAuth()
  const [files, setFiles] = useState<FileRecord[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedProject, setSelectedProject] = useState('')
  const [uploadProject, setUploadProject] = useState('')
  const [search, setSearch] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setFiles(data || [])
    setLoading(false)
  }, [])

  const fetchProjects = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name, archived')
      .order('project_name')
    if (!error) {
      setProjects((data || []).filter((p) => !p.archived))
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFiles()
      fetchProjects()
    } else {
      setFiles([
        {
          id: 'sample-1',
          name: 'Living Room Floor Plan.pdf',
          file_path: 'sample/living-room-floor-plan.pdf',
          file_type: 'pdf',
          file_size: 2456789,
          mime_type: 'application/pdf',
          description: 'Floor plan for modern living room redesign',
          tags: ['floor-plan', 'living-room'],
          project_id: 'sample-project-1',
          created_at: '2024-01-15T14:30:00Z',
        },
      ])
      setProjects([{ id: 'sample-project-1', project_name: 'Modern Living Room Redesign' }])
      setLoading(false)
    }
  }, [user, fetchFiles, fetchProjects])

  const handleFileUpload = async (fileList: FileList) => {
    if (!user) return
    setUploading(true)

    const uploadPromises = Array.from(fileList).map(async (file) => {
      try {
        const fileName = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('idstudio-files')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return
        }

        const fileExt = file.name.split('.').pop()
        await supabase.from('files').insert({
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: fileExt || null,
          file_size: file.size,
          mime_type: file.type,
          project_id: uploadProject || null,
          description: null,
          tags: null,
        })
      } catch (err) {
        console.error('Upload exception:', err)
      }
    })

    await Promise.all(uploadPromises)
    setUploading(false)
    await fetchFiles()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files)
  }

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    if (!confirm('Delete this file permanently?')) return
    await supabase.storage.from('idstudio-files').remove([filePath])
    await supabase.from('files').delete().eq('id', fileId)
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from('idstudio-files').download(filePath)
    if (error || !data) return
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null
    return projects.find((p) => p.id === projectId)?.project_name || null
  }

  const filtered = files.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchProject = !selectedProject || f.project_id === selectedProject
    return matchSearch && matchProject
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-foreground">Files</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your project files</p>
        </motion.div>

        {/* Upload area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-end gap-4 mb-4">
              <div className="space-y-2">
                <Label>Assign to Project</Label>
                <select
                  value={uploadProject}
                  onChange={(e) => setUploadProject(e.target.value)}
                  className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild disabled={uploading}>
                  <label htmlFor="file-upload" className="cursor-pointer gap-2">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Uploading...' : 'Choose Files'}
                  </label>
                </Button>
              </div>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
              }`}
            >
              <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or use the button above
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">All file types · Max 50 MB per file</p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-10"
            />
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search || selectedProject ? 'No files match your filters.' : 'No files uploaded yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-2"
          >
            {filtered.map((file) => (
              <Card key={file.id} className="hover:shadow-soft-md transition-shadow group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</span>
                      {file.file_type && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {file.file_type.toUpperCase()}
                        </Badge>
                      )}
                      {getProjectName(file.project_id) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getProjectName(file.project_id)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(file.file_path, file.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFile(file.id, file.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <span className="text-xs text-muted-foreground shrink-0">
                    {file.created_at ? new Date(file.created_at).toLocaleDateString() : ''}
                  </span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
