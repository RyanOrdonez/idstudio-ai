'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import {
  listInvoices,
  deleteInvoice,
  type Invoice,
  type InvoiceStatus,
} from '@/lib/invoices'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Download,
  Link2,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'

interface ClientLite {
  id: string
  name: string
}

interface ProjectLite {
  id: string
  project_name: string
  client_id: string | null
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const SELECT_CLASS =
  'flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function FinancialsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<ClientLite[]>([])
  const [projects, setProjects] = useState<ProjectLite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string
    number: string
  } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const [invs, clientsRes, projectsRes] = await Promise.all([
        listInvoices(user.id),
        supabase
          .from('clients')
          .select('id, name')
          .eq('user_id', user.id)
          .or('archived.is.null,archived.eq.false')
          .order('name', { ascending: true }),
        supabase
          .from('projects')
          .select('id, project_name, client_id')
          .eq('user_id', user.id)
          .or('archived.is.null,archived.eq.false')
          .order('project_name', { ascending: true }),
      ])
      setInvoices(invs)
      setClients((clientsRes.data as ClientLite[]) || [])
      setProjects((projectsRes.data as ProjectLite[]) || [])
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter
      if (!matchStatus) return false
      if (!search.trim()) return true
      const s = search.toLowerCase()
      const clientName = clients.find((c) => c.id === inv.client_id)?.name || ''
      return (
        inv.invoice_number.toLowerCase().includes(s) ||
        clientName.toLowerCase().includes(s)
      )
    })
  }, [invoices, statusFilter, search, clients])

  const getClientName = (clientId: string | null) =>
    clientId ? clients.find((c) => c.id === clientId)?.name : null

  const getProjectName = (projectId: string | null) =>
    projectId ? projects.find((p) => p.id === projectId)?.project_name : null

  const handleView = (id: string) => router.push(`/dashboard/financials/${id}`)

  const handleDownloadPDF = (id: string) => {
    window.open(`/api/invoices/${id}/pdf?download=1`, '_blank')
  }

  const handleGetPaymentLink = async (id: string) => {
    setActionError(null)
    setActionLoading(id)
    try {
      const res = await fetch(`/api/invoices/${id}/payment-link`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create payment link')
      }
      try {
        await navigator.clipboard.writeText(data.url)
      } catch {
        // ignore clipboard failure
      }
      window.open(data.url, '_blank')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create payment link')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setActionError(null)
    setActionLoading(confirmDelete.id)
    try {
      await deleteInvoice(confirmDelete.id)
      setConfirmDelete(null)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete invoice')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-foreground">
                Financials
              </h1>
              <p className="text-muted-foreground mt-1">
                Track invoices and payments
              </p>
            </div>
            <Button
              variant="warm"
              onClick={() => router.push('/dashboard/financials/new')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New invoice
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by invoice number or client"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              className={SELECT_CLASS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {actionError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {actionError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warm-100 mb-4">
                  <Receipt className="h-7 w-7 text-warm-700" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {invoices.length === 0 ? 'No invoices yet' : 'No matching invoices'}
                </h3>
                <p className="text-muted-foreground max-w-sm mb-5">
                  {invoices.length === 0
                    ? 'Create your first invoice to start tracking client payments.'
                    : 'Try adjusting the search or status filter.'}
                </p>
                {invoices.length === 0 && (
                  <Button
                    variant="warm"
                    onClick={() => router.push('/dashboard/financials/new')}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create first invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((inv) => {
                const clientName = getClientName(inv.client_id)
                const projectName = getProjectName(inv.project_id)
                return (
                  <Card
                    key={inv.id}
                    className="group hover:border-warm-300 transition-colors cursor-pointer"
                    onClick={() => handleView(inv.id)}
                  >
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-medium text-foreground">
                            {inv.invoice_number}
                          </span>
                          <InvoiceStatusBadge invoice={inv} />
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {clientName || 'No client'}
                          {projectName && (
                            <span className="text-muted-foreground/60"> · {projectName}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground/80 mt-0.5">
                          Issued {fmtDate(inv.issue_date)}
                          {inv.due_date && <> · Due {fmtDate(inv.due_date)}</>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-serif font-semibold text-foreground">
                          {fmtMoney(Number(inv.total))}
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadPDF(inv.id)
                          }}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Download PDF"
                          aria-label="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'canceled' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGetPaymentLink(inv.id)
                            }}
                            disabled={actionLoading === inv.id}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title="Get payment link"
                            aria-label="Get payment link"
                          >
                            {actionLoading === inv.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleView(inv.id)
                          }}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="View / edit"
                          aria-label="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete({
                              id: inv.id,
                              number: inv.invoice_number,
                            })
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          aria-label="Delete invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 shrink-0 md:hidden" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice?</DialogTitle>
            <DialogDescription>
              Invoice{' '}
              <span className="font-mono font-medium">{confirmDelete?.number}</span>{' '}
              will be permanently removed along with its line items and payment
              history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={actionLoading === confirmDelete?.id}
            >
              {actionLoading === confirmDelete?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                'Delete invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
