'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import {
  computeInvoiceTotals,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceWithItems,
} from '@/lib/invoices'
import { InvoiceLineItemRow, type LineItemDraft } from './InvoiceLineItemRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, AlertCircle } from 'lucide-react'

interface ClientRow {
  id: string
  name: string
  email: string | null
}

interface ProjectRow {
  id: string
  project_name: string
  client_id: string | null
}

export interface InvoiceFormProps {
  mode: 'create' | 'edit'
  initial?: InvoiceWithItems
  onSubmit: (input: CreateInvoiceInput | UpdateInvoiceInput) => Promise<void>
  onCancel: () => void
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const SELECT_CLASS =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function InvoiceForm({ mode, initial, onSubmit, onCancel }: InvoiceFormProps) {
  const { user } = useAuth()

  const [clients, setClients] = useState<ClientRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoice_number || '')
  const [clientId, setClientId] = useState<string | null>(initial?.client_id || null)
  const [projectId, setProjectId] = useState<string | null>(initial?.project_id || null)
  const [issueDate, setIssueDate] = useState(initial?.issue_date || todayISO())
  const [dueDate, setDueDate] = useState(initial?.due_date || '')
  const [taxRate, setTaxRate] = useState(
    initial ? String(initial.tax_rate * 100) : '0'
  )
  const [notes, setNotes] = useState(initial?.notes || '')
  const [terms, setTerms] = useState(initial?.terms || 'Payment due within 30 days.')
  const [lineItems, setLineItems] = useState<LineItemDraft[]>(
    initial?.line_items?.length
      ? initial.line_items.map((li) => ({
          description: li.description,
          quantity: String(li.quantity),
          unit_price: String(li.unit_price),
        }))
      : [{ description: '', quantity: '1', unit_price: '0' }]
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients + projects on mount
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [clientsRes, projectsRes] = await Promise.all([
          supabase
            .from('clients')
            .select('id, name, email')
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
        if (cancelled) return
        setClients((clientsRes.data as ClientRow[]) || [])
        setProjects((projectsRes.data as ProjectRow[]) || [])
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load clients/projects:', err)
        }
      } finally {
        if (!cancelled) setLoadingLists(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // When client changes, reset project if it doesn't belong to the new client
  useEffect(() => {
    if (!projectId || !clientId) return
    const project = projects.find((p) => p.id === projectId)
    if (project && project.client_id && project.client_id !== clientId) {
      setProjectId(null)
    }
  }, [clientId, projectId, projects])

  // Filtered projects list
  const filteredProjects = useMemo(() => {
    if (!clientId) return projects
    return projects.filter((p) => !p.client_id || p.client_id === clientId)
  }, [clientId, projects])

  // Live totals
  const totals = useMemo(() => {
    const numeric = lineItems.map((li) => ({
      quantity: parseFloat(li.quantity) || 0,
      unit_price: parseFloat(li.unit_price) || 0,
    }))
    const taxRateDecimal = (parseFloat(taxRate) || 0) / 100
    return computeInvoiceTotals(numeric, taxRateDecimal)
  }, [lineItems, taxRate])

  const addLineItem = () =>
    setLineItems([...lineItems, { description: '', quantity: '1', unit_price: '0' }])

  const removeLineItem = (i: number) =>
    setLineItems(lineItems.filter((_, idx) => idx !== i))

  const updateLineItem = (i: number, field: keyof LineItemDraft, value: string) =>
    setLineItems(
      lineItems.map((li, idx) => (idx === i ? { ...li, [field]: value } : li))
    )

  const handleSubmit = async () => {
    setError(null)

    // Validation
    const nonEmpty = lineItems.filter((li) => li.description.trim().length > 0)
    if (nonEmpty.length === 0) {
      setError('Add at least one line item with a description.')
      return
    }
    for (const li of lineItems) {
      if (li.description.trim().length === 0) continue
      const q = parseFloat(li.quantity)
      const p = parseFloat(li.unit_price)
      if (isNaN(q) || q < 0) {
        setError('Line item quantities must be non-negative numbers.')
        return
      }
      if (isNaN(p) || p < 0) {
        setError('Line item unit prices must be non-negative numbers.')
        return
      }
    }
    if (dueDate && issueDate && new Date(dueDate) < new Date(issueDate)) {
      setError('Due date must be on or after the issue date.')
      return
    }
    const taxRateNum = parseFloat(taxRate)
    if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
      setError('Tax rate must be a percentage between 0 and 100.')
      return
    }

    setSubmitting(true)
    try {
      const taxRateDecimal = taxRateNum / 100
      const payload: CreateInvoiceInput = {
        client_id: clientId,
        project_id: projectId,
        invoice_number: invoiceNumber.trim() || undefined,
        issue_date: issueDate,
        due_date: dueDate || null,
        tax_rate: taxRateDecimal,
        notes: notes.trim() || null,
        terms: terms.trim() || null,
        line_items: nonEmpty.map((li, i) => ({
          description: li.description.trim(),
          quantity: parseFloat(li.quantity) || 0,
          unit_price: parseFloat(li.unit_price) || 0,
          position: i,
        })),
      }
      await onSubmit(payload)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save invoice'
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metadata card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Auto-generate (e.g. 2026-04-0001)"
              />
            </div>
            <div className="space-y-2">
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Issue date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <select
                className={SELECT_CLASS}
                value={clientId ?? ''}
                onChange={(e) => setClientId(e.target.value || null)}
                disabled={loadingLists}
              >
                <option value="">— No client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.email ? ' (no email)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <select
                className={SELECT_CLASS}
                value={projectId ?? ''}
                onChange={(e) => setProjectId(e.target.value || null)}
                disabled={loadingLists}
              >
                <option value="">— No project —</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items card */}
      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2 hidden md:grid">
            <div className="col-span-6">Description</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit price</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1"></div>
          </div>
          {lineItems.map((li, i) => (
            <InvoiceLineItemRow
              key={i}
              value={li}
              onChange={(field, value) => updateLineItem(i, field, value)}
              onRemove={() => removeLineItem(i)}
              showRemove={lineItems.length > 1}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLineItem}
            className="mt-2 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add line item
          </Button>
        </CardContent>
      </Card>

      {/* Totals card */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmtMoney(totals.subtotal)}</span>
            </div>
            {totals.taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({(parseFloat(taxRate) || 0).toFixed(2)}%)
                </span>
                <span className="font-medium">{fmtMoney(totals.taxAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-serif font-semibold">Total</span>
              <span className="text-xl font-serif font-semibold text-warm-700">
                {fmtMoney(totals.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes + terms card */}
      <Card>
        <CardHeader>
          <CardTitle>Additional details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Notes (visible on the invoice)</Label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Phase 1 deliverables"
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment terms</Label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="E.g. Payment due within 30 days"
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="warm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : mode === 'create' ? (
            'Create invoice'
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  )
}
