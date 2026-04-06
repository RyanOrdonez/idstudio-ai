'use client'

import { useEffect, useState } from 'react'
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
  Mail,
  Phone,
  MapPin,
  Pencil,
  Archive,
  Trash2,
  RotateCcw,
  Users,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  archived?: boolean
  created_at?: string
}

export default function DashboardClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentClientId, setCurrentClientId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'archive' | 'delete'
    client: { id: string; name: string }
  } | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user) fetchClients()
    else {
      setClients([
        {
          id: 'sample-1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 123-4567',
          address: '1234 Oak Avenue, San Francisco, CA 94102',
          notes: 'Modern minimalist style, neutral colors.',
          created_at: '2024-01-15T09:00:00Z',
        },
      ])
      setLoading(false)
    }
  }, [user])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or('archived.is.null,archived.eq.false')
      .order('created_at', { ascending: false })
    if (!error) setClients(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setNotes('')
  }

  const openCreate = () => {
    resetForm()
    setIsEditing(false)
    setCurrentClientId(null)
    setIsFormOpen(true)
  }

  const openEdit = (c: Client) => {
    setCurrentClientId(c.id)
    setName(c.name || '')
    setEmail(c.email || '')
    setPhone(c.phone || '')
    setAddress(c.address || '')
    setNotes(c.notes || '')
    setIsEditing(true)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!user) return
    const payload = {
      user_id: user.id,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    }

    const { error } = isEditing && currentClientId
      ? await supabase.from('clients').update(payload).eq('id', currentClientId)
      : await supabase.from('clients').insert([payload])

    if (!error) {
      setIsFormOpen(false)
      resetForm()
      await fetchClients()
    }
  }

  const handleArchive = async (id: string) => {
    await supabase.from('clients').update({ archived: true }).eq('id', id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    setConfirmDialog(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    setConfirmDialog(null)
  }

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  )

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
            <h1 className="text-3xl font-semibold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your client relationships</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="pl-10"
          />
        </div>

        {/* Client form (inline card) */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? 'Edit Client' : 'New Client'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Notes</Label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Design preferences, budget notes..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm() }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!name.trim()}>
                    {isEditing ? 'Update' : 'Save Client'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No clients match your search.' : 'No clients yet. Add your first client to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-3"
          >
            {filtered.map((client) => (
              <Card key={client.id} className="hover:shadow-soft-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base">{client.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {client.phone}
                          </span>
                        )}
                        {client.address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {client.address}
                          </span>
                        )}
                      </div>
                      {client.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{client.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700"
                        onClick={() => setConfirmDialog({ type: 'archive', client: { id: client.id, name: client.name } })}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDialog({ type: 'delete', client: { id: client.id, name: client.name } })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                {confirmDialog.type === 'archive' ? 'Archive' : 'Delete'} Client
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.type === 'archive'
                  ? `Are you sure you want to archive "${confirmDialog.client.name}"? You can restore them later.`
                  : `Permanently delete "${confirmDialog.client.name}"? This cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button
                variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
                onClick={() =>
                  confirmDialog.type === 'archive'
                    ? handleArchive(confirmDialog.client.id)
                    : handleDelete(confirmDialog.client.id)
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
