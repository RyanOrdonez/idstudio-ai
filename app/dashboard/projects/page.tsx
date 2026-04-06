'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  MapPin,
  DollarSign,
  Pencil,
  Archive,
  Trash2,
  FolderKanban,
  ImageIcon,
} from 'lucide-react'

interface Project {
  id: string
  project_name: string
  client_name: string | null
  street_address: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  notes: string | null
  budget: number | null
  featured_image: string | null
  archived?: boolean
  created_at?: string
}

export default function DashboardProjects() {
  const router = useRouter()
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'archive' | 'delete'
    project: { id: string; name: string }
  } | null>(null)

  // Form state
  const [projectName, setProjectName] = useState('')
  const [clientName, setClientName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [notes, setNotes] = useState('')
  const [budget, setBudget] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')

  useEffect(() => {
    if (user) fetchProjects()
    else {
      setProjects([
        {
          id: 'sample-1',
          project_name: 'Modern Living Room Redesign',
          client_name: 'Sarah Johnson',
          street_address: '1234 Oak Avenue',
          city: 'San Francisco',
          state: 'CA',
          zipcode: '94102',
          notes: 'Complete living room transformation with modern furniture.',
          budget: 85000,
          featured_image: null,
          created_at: '2024-01-15T10:30:00Z',
        },
      ])
      setLoading(false)
    }
  }, [user])

  const fetchProjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or('archived.is.null,archived.eq.false')
      .order('created_at', { ascending: false })
    if (!error) setProjects(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setProjectName('')
    setClientName('')
    setStreetAddress('')
    setCity('')
    setState('')
    setZipcode('')
    setNotes('')
    setBudget('')
    setFeaturedImage('')
  }

  const openCreate = () => {
    resetForm()
    setIsEditing(false)
    setCurrentProjectId(null)
    setIsFormOpen(true)
  }

  const openEdit = (p: Project) => {
    setCurrentProjectId(p.id)
    setProjectName(p.project_name || '')
    setClientName(p.client_name || '')
    setStreetAddress(p.street_address || '')
    setCity(p.city || '')
    setState(p.state || '')
    setZipcode(p.zipcode || '')
    setNotes(p.notes || '')
    setBudget(p.budget != null ? String(p.budget) : '')
    setFeaturedImage(p.featured_image || '')
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!user) return
    const payload = {
      project_name: projectName.trim(),
      client_name: clientName.trim() || null,
      street_address: streetAddress.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zipcode: zipcode.trim() || null,
      notes: notes.trim() || null,
      budget: budget ? Number(budget.replace(/[^0-9.]/g, '')) : null,
      featured_image: featuredImage.trim() || null,
    }

    const { error } = isEditing && currentProjectId
      ? await supabase.from('projects').update(payload).eq('id', currentProjectId)
      : await supabase.from('projects').insert([payload])

    if (!error) {
      setIsFormOpen(false)
      resetForm()
      await fetchProjects()
    }
  }

  const handleArchive = async (id: string) => {
    await supabase.from('projects').update({ archived: true }).eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setConfirmDialog(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setConfirmDialog(null)
  }

  const filtered = projects.filter(
    (p) =>
      p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatBudget = (val: number | null) =>
    val != null ? `$${val.toLocaleString()}` : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Track and manage your design projects</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-10"
          />
        </div>

        {/* Project form */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Project' : 'New Project'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Modern Living Room" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Street Address</Label>
                    <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="1234 Oak Avenue" />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Francisco" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip</Label>
                      <Input value={zipcode} onChange={(e) => setZipcode(e.target.value)} placeholder="94102" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Budget</Label>
                    <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="85000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Featured Image URL</Label>
                    <Input type="url" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Project description, style preferences..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm() }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!projectName.trim()}>
                    {isEditing ? 'Update' : 'Save Project'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Project grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderKanban className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No projects match your search.' : 'No projects yet. Create your first project to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {filtered.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-soft-md transition-shadow group cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                {/* Image header */}
                <div className="h-40 bg-secondary flex items-center justify-center overflow-hidden">
                  {project.featured_image ? (
                    <img
                      src={project.featured_image}
                      alt={project.project_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>

                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-base leading-tight">
                      {project.project_name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(project) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDialog({ type: 'archive', project: { id: project.id, name: project.project_name } })
                        }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {project.client_name && (
                    <p className="text-sm text-muted-foreground mb-2">Client: {project.client_name}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {(project.city || project.state) && (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <MapPin className="h-3 w-3" />
                        {[project.city, project.state].filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {project.budget != null && (
                      <Badge variant="warm" className="gap-1 font-normal">
                        <DollarSign className="h-3 w-3" />
                        {formatBudget(project.budget)}
                      </Badge>
                    )}
                  </div>

                  {project.notes && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{project.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmDialog && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.type === 'archive' ? 'Archive' : 'Delete'} Project
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.type === 'archive'
                  ? `Archive "${confirmDialog.project.name}"? You can restore it later.`
                  : `Permanently delete "${confirmDialog.project.name}"? This cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button
                variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
                onClick={() =>
                  confirmDialog.type === 'archive'
                    ? handleArchive(confirmDialog.project.id)
                    : handleDelete(confirmDialog.project.id)
                }
              >
                {confirmDialog.type === 'archive' ? 'Archive' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
