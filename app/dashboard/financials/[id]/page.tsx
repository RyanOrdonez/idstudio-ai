'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoiceSent,
  markInvoicePaid,
  listPaymentsForInvoice,
  type InvoiceWithItems,
  type Payment,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from '@/lib/invoices'
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  Download,
  Link2,
  Trash2,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'

interface ClientSlim {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

interface ProjectSlim {
  id: string
  project_name: string
  street_address: string | null
  city: string | null
  state: string | null
  zipcode: string | null
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

const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [client, setClient] = useState<ClientSlim | null>(null)
  const [project, setProject] = useState<ProjectSlim | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [markPaidAmount, setMarkPaidAmount] = useState('')
  const [markPaidMethod, setMarkPaidMethod] = useState<'manual' | 'other'>('manual')
  const [markPaidNotes, setMarkPaidNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const fresh = await getInvoice(params.id)
      if (!fresh) {
        setNotFound(true)
        return
      }
      setInvoice(fresh)

      // Load client, project, payments in parallel
      const [clientRes, projectRes, paymentsRes] = await Promise.all([
        fresh.client_id
          ? supabase
              .from('clients')
              .select('id, name, email, phone, address')
              .eq('id', fresh.client_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        fresh.project_id
          ? supabase
              .from('projects')
              .select('id, project_name, street_address, city, state, zipcode')
              .eq('id', fresh.project_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        listPaymentsForInvoice(fresh.id),
      ])

      setClient((clientRes.data as ClientSlim | null) || null)
      setProject((projectRes.data as ProjectSlim | null) || null)
      setPayments(paymentsRes)
    } catch (err) {
      console.error('Failed to load invoice:', err)
      setActionError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    refetch()
  }, [refetch])

  const handleUpdate = async (
    input: CreateInvoiceInput | UpdateInvoiceInput
  ): Promise<void> => {
    if (!user || !invoice) throw new Error('Not ready')
    await updateInvoice(invoice.id, user.id, input as UpdateInvoiceInput)
    await refetch()
    setEditMode(false)
  }

  const handleMarkSent = async () => {
    if (!invoice) return
    setActionError(null)
    setActionLoading('sent')
    try {
      await markInvoiceSent(invoice.id)
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark as sent')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkPaidSubmit = async () => {
    if (!invoice || !user) return
    setActionError(null)
    setActionLoading('markPaid')
    try {
      const amt = parseFloat(markPaidAmount) || Number(invoice.total)
      if (amt <= 0) {
        setActionError('Payment amount must be greater than zero.')
        return
      }
      await markInvoicePaid(
        invoice.id,
        user.id,
        amt,
        markPaidMethod,
        markPaidNotes.trim() || null
      )
      setMarkPaidOpen(false)
      setMarkPaidAmount('')
      setMarkPaidNotes('')
      setMarkPaidMethod('manual')
      await refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = () => {
    if (!invoice) return
    window.open(`/api/invoices/${invoice.id}/pdf?download=1`, '_blank')
  }

  const handleGetPaymentLink = async () => {
    if (!invoice) return
    setActionError(null)
    setActionLoading('paymentLink')
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payment-link`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create payment link')
      }
      setPaymentLinkUrl(data.url)
      try {
        await navigator.clipboard.writeText(data.url)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2500)
      } catch {
        // ignore
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create payment link')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCopyPaymentLink = async () => {
    if (!paymentLinkUrl) return
    try {
      await navigator.clipboard.writeText(paymentLinkUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const handleDeleteConfirm = async () => {
    if (!invoice) return
    setActionError(null)
    setActionLoading('delete')
    try {
      await deleteInvoice(invoice.id)
      router.push('/dashboard/financials')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete invoice')
      setActionLoading(null)
    }
  }

  const openMarkPaidDialog = () => {
    if (!invoice) return
    setMarkPaidAmount(String(invoice.total))
    setMarkPaidMethod('manual')
    setMarkPaidNotes('')
    setMarkPaidOpen(true)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !invoice) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Invoice not found
          </h1>
          <p className="text-muted-foreground mb-6">
            It may have been deleted or you may not have access.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard/financials')}>
            Back to invoices
          </Button>
        </div>
      </div>
    )
  }

  const projectAddr = project
    ? [project.street_address, project.city, project.state, project.zipcode]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/financials')}
            className="gap-2 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to invoices
          </Button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-serif font-semibold text-foreground font-mono">
                  {invoice.invoice_number}
                </h1>
                <InvoiceStatusBadge invoice={invoice} />
              </div>
              <p className="text-muted-foreground">
                {client?.name || 'No client'}
                {project?.project_name && (
                  <span className="text-muted-foreground/60"> · {project.project_name}</span>
                )}
              </p>
            </div>
            {!editMode && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {invoice.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkSent}
                    disabled={actionLoading === 'sent'}
                    className="gap-1.5"
                  >
                    {actionLoading === 'sent' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Mark sent
                  </Button>
                )}
                {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMarkPaidDialog}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark paid
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                  <Button
                    variant="warm"
                    size="sm"
                    onClick={handleGetPaymentLink}
                    disabled={actionLoading === 'paymentLink'}
                    className="gap-1.5"
                  >
                    {actionLoading === 'paymentLink' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Link2 className="h-3.5 w-3.5" />
                    )}
                    Get payment link
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {actionError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {actionError}
            </div>
          )}

          {/* Payment link success card */}
          {paymentLinkUrl && !editMode && (
            <Card className="mb-6 border-warm-300 bg-warm-50/50">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warm-200">
                    <Link2 className="h-4 w-4 text-warm-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      Payment link ready
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Send this to your client. Expires in 24 hours.
                    </p>
                    <div className="bg-background rounded-lg border border-border px-3 py-2 font-mono text-xs break-all text-muted-foreground">
                      {paymentLinkUrl}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPaymentLink}
                      className="gap-1.5"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentLinkUrl, '_blank')}
                      className="gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Body */}
          {editMode ? (
            <InvoiceForm
              mode="edit"
              initial={invoice}
              onSubmit={handleUpdate}
              onCancel={() => setEditMode(false)}
            />
          ) : (
            <div className="space-y-6">
              {/* Metadata card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Issued
                      </div>
                      <div className="text-sm text-foreground">
                        {fmtDate(invoice.issue_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Due
                      </div>
                      <div className="text-sm text-foreground">
                        {fmtDate(invoice.due_date)}
                      </div>
                    </div>
                    {invoice.sent_at && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Sent
                        </div>
                        <div className="text-sm text-foreground">
                          {fmtDateTime(invoice.sent_at)}
                        </div>
                      </div>
                    )}
                    {invoice.paid_at && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Paid
                        </div>
                        <div className="text-sm text-foreground">
                          {fmtDateTime(invoice.paid_at)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bill To card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Bill to
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {client ? (
                    <>
                      <div className="font-semibold text-foreground text-base">
                        {client.name}
                      </div>
                      {client.email && (
                        <div className="text-sm text-muted-foreground mt-0.5">{client.email}</div>
                      )}
                      {client.phone && (
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      )}
                      {client.address && (
                        <div className="text-sm text-muted-foreground">{client.address}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No client linked
                    </div>
                  )}
                  {projectAddr && (
                    <div className="mt-3 text-sm text-muted-foreground italic">
                      Project: {project?.project_name} — {projectAddr}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Line items card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Line items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2 mb-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  {invoice.line_items.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic py-4">
                      No line items
                    </div>
                  ) : (
                    invoice.line_items.map((li) => (
                      <div
                        key={li.id}
                        className="grid grid-cols-12 gap-2 py-3 text-sm border-b border-border/50 last:border-0"
                      >
                        <div className="col-span-6 text-foreground">{li.description}</div>
                        <div className="col-span-2 text-right text-muted-foreground">
                          {li.quantity}
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground">
                          {fmtMoney(Number(li.unit_price))}
                        </div>
                        <div className="col-span-2 text-right font-medium text-foreground">
                          {fmtMoney(Number(li.amount))}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Totals */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-full md:w-80 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          {fmtMoney(Number(invoice.subtotal))}
                        </span>
                      </div>
                      {Number(invoice.tax_rate) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Tax ({(Number(invoice.tax_rate) * 100).toFixed(2)}%)
                          </span>
                          <span className="font-medium">
                            {fmtMoney(Number(invoice.tax_amount))}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="font-serif font-semibold">Total</span>
                        <span className="text-xl font-serif font-semibold text-warm-700">
                          {fmtMoney(Number(invoice.total))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes + terms card */}
              {(invoice.notes || invoice.terms) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {invoice.notes && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Notes
                        </div>
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {invoice.notes}
                        </div>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Payment terms
                        </div>
                        <div className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {invoice.terms}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment history card */}
              {payments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Payment history
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {fmtMoney(Number(p.amount))}{' '}
                            <span className="text-xs font-normal text-muted-foreground ml-2 uppercase tracking-wide">
                              {p.method}
                            </span>
                          </div>
                          {p.notes && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {p.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDateTime(p.paid_at)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mark Paid dialog */}
      <Dialog
        open={markPaidOpen}
        onOpenChange={(open) => {
          if (!open) setMarkPaidOpen(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark invoice paid</DialogTitle>
            <DialogDescription>
              Record a payment received outside of Stripe (check, ACH, cash, etc.).
              Stripe payments are recorded automatically via webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={markPaidAmount}
                onChange={(e) => setMarkPaidAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <select
                className={SELECT_CLASS}
                value={markPaidMethod}
                onChange={(e) => setMarkPaidMethod(e.target.value as 'manual' | 'other')}
              >
                <option value="manual">Manual (check, ACH, etc.)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={markPaidNotes}
                onChange={(e) => setMarkPaidNotes(e.target.value)}
                placeholder="e.g. Check #1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="warm"
              onClick={handleMarkPaidSubmit}
              disabled={actionLoading === 'markPaid'}
            >
              {actionLoading === 'markPaid' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording…
                </>
              ) : (
                'Record payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice?</DialogTitle>
            <DialogDescription>
              Invoice{' '}
              <span className="font-mono font-medium">{invoice.invoice_number}</span>{' '}
              will be permanently removed along with its line items and payment
              history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? (
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
