/**
 * Invoice data layer — client-side helpers backed by Supabase + RLS.
 *
 * Matches the project's established CRUD pattern (see lib/subscription.ts):
 * - Direct Supabase client calls using the cookie-based client.
 * - Throws on Supabase errors; `getInvoice` returns null on PGRST116 (not found).
 * - Totals are recomputed server-of-truth on create/update via `computeInvoiceTotals`.
 * - Line-item management uses delete-all-and-reinsert on update (simple, correct for small N).
 */

import { supabase } from './supabaseClient'

// ---------- Types ----------

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled'
export type PaymentMethod = 'stripe' | 'manual' | 'other'

export interface Invoice {
  id: string
  user_id: string
  client_id: string | null
  project_id: string | null
  invoice_number: string
  status: InvoiceStatus
  issue_date: string // YYYY-MM-DD
  due_date: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  notes: string | null
  terms: string | null
  stripe_customer_id: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  sent_at: string | null
  paid_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  user_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  position: number
  created_at: string
}

export interface InvoiceWithItems extends Invoice {
  line_items: InvoiceLineItem[]
}

export interface Payment {
  id: string
  invoice_id: string
  user_id: string
  amount: number
  method: PaymentMethod
  stripe_payment_intent_id: string | null
  paid_at: string
  notes: string | null
  created_at: string
}

export interface CreateInvoiceInput {
  client_id?: string | null
  project_id?: string | null
  invoice_number?: string
  status?: InvoiceStatus
  issue_date?: string
  due_date?: string | null
  tax_rate?: number
  notes?: string | null
  terms?: string | null
  line_items: Array<{
    description: string
    quantity: number
    unit_price: number
    position?: number
  }>
}

export interface UpdateInvoiceInput {
  client_id?: string | null
  project_id?: string | null
  invoice_number?: string
  status?: InvoiceStatus
  issue_date?: string
  due_date?: string | null
  tax_rate?: number
  notes?: string | null
  terms?: string | null
  line_items?: Array<{
    description: string
    quantity: number
    unit_price: number
    position?: number
  }>
}

// ---------- Pure helpers ----------

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Pure totals calculation. Used by the form (live totals as the user types)
 * and by createInvoice/updateInvoice (server-of-truth recompute).
 */
export function computeInvoiceTotals(
  lineItems: Array<{ quantity: number; unit_price: number }>,
  taxRate: number
): { subtotal: number; taxAmount: number; total: number } {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + (li.quantity || 0) * (li.unit_price || 0),
    0
  )
  const taxAmount = subtotal * (taxRate || 0)
  const total = subtotal + taxAmount
  return {
    subtotal: round2(subtotal),
    taxAmount: round2(taxAmount),
    total: round2(total),
  }
}

/**
 * Generate the next invoice number for a user. Format: `YYYY-MM-NNNN`.
 * Race condition (two concurrent creates) is handled at the DB level by the
 * composite UNIQUE(user_id, invoice_number) constraint — the caller should
 * catch `23505` and retry once if the number was auto-generated.
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `${yyyy}-${mm}-`

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextSeq = 1
  if (data && data.length > 0) {
    const lastSeq = parseInt(data[0].invoice_number.slice(prefix.length), 10)
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1
  }
  return `${prefix}${String(nextSeq).padStart(4, '0')}`
}

// ---------- List / read ----------

export interface ListInvoicesFilters {
  status?: InvoiceStatus | 'all'
  clientId?: string
  projectId?: string
  search?: string // matches invoice_number only; client-name search happens in the page component
}

export async function listInvoices(
  userId: string,
  filters?: ListInvoicesFilters
): Promise<Invoice[]> {
  let q = supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters?.clientId) q = q.eq('client_id', filters.clientId)
  if (filters?.projectId) q = q.eq('project_id', filters.projectId)
  if (filters?.search) q = q.ilike('invoice_number', `%${filters.search}%`)

  const { data, error } = await q
  if (error) throw error
  return (data as Invoice[]) || []
}

export async function getInvoice(
  invoiceId: string
): Promise<InvoiceWithItems | null> {
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle()

  if (invErr) {
    // PostgREST "row not found"
    if ((invErr as { code?: string }).code === 'PGRST116') return null
    throw invErr
  }
  if (!invoice) return null

  const { data: lineItems, error: liErr } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('position', { ascending: true })

  if (liErr) throw liErr

  return { ...(invoice as Invoice), line_items: (lineItems as InvoiceLineItem[]) || [] }
}

export async function listPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Payment[]) || []
}

// ---------- Create ----------

export async function createInvoice(
  userId: string,
  data: CreateInvoiceInput
): Promise<InvoiceWithItems> {
  const { subtotal, taxAmount, total } = computeInvoiceTotals(
    data.line_items,
    data.tax_rate ?? 0
  )

  // Auto-generate invoice number if not provided
  const autoNumber = !data.invoice_number
  let invoiceNumber = data.invoice_number || (await generateInvoiceNumber(userId))

  // Insert the invoice header. On unique violation (23505) with auto-generated
  // number, retry once with a regenerated number.
  let invoice: Invoice | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: ins, error: insErr } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        client_id: data.client_id ?? null,
        project_id: data.project_id ?? null,
        invoice_number: invoiceNumber,
        status: data.status ?? 'draft',
        issue_date: data.issue_date ?? new Date().toISOString().slice(0, 10),
        due_date: data.due_date ?? null,
        subtotal,
        tax_rate: data.tax_rate ?? 0,
        tax_amount: taxAmount,
        total,
        currency: 'usd',
        notes: data.notes ?? null,
        terms: data.terms ?? null,
      })
      .select()
      .single()

    if (!insErr) {
      invoice = ins as Invoice
      break
    }

    const code = (insErr as { code?: string }).code
    if (code === '23505' && autoNumber && attempt === 0) {
      // Unique violation on (user_id, invoice_number). Regenerate and retry once.
      invoiceNumber = await generateInvoiceNumber(userId)
      continue
    }
    throw insErr
  }

  if (!invoice) throw new Error('Failed to create invoice')

  // Insert line items in a single batch. If this fails, compensating delete of the invoice.
  if (data.line_items.length > 0) {
    const lineRows = data.line_items.map((li, i) => ({
      invoice_id: invoice!.id,
      user_id: userId,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      amount: round2(li.quantity * li.unit_price),
      position: li.position ?? i,
    }))

    const { data: insertedItems, error: liErr } = await supabase
      .from('invoice_line_items')
      .insert(lineRows)
      .select()
      .order('position', { ascending: true })

    if (liErr) {
      // Compensating cleanup — best effort
      await supabase.from('invoices').delete().eq('id', invoice.id)
      throw liErr
    }

    return { ...invoice, line_items: (insertedItems as InvoiceLineItem[]) || [] }
  }

  return { ...invoice, line_items: [] }
}

// ---------- Update ----------

export async function updateInvoice(
  invoiceId: string,
  userId: string,
  data: UpdateInvoiceInput
): Promise<InvoiceWithItems> {
  // If line items are being replaced, recompute totals from them.
  let totals: { subtotal: number; taxAmount: number; total: number } | null = null
  if (data.line_items !== undefined) {
    totals = computeInvoiceTotals(data.line_items, data.tax_rate ?? 0)
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (data.client_id !== undefined) updatePayload.client_id = data.client_id
  if (data.project_id !== undefined) updatePayload.project_id = data.project_id
  if (data.invoice_number !== undefined) updatePayload.invoice_number = data.invoice_number
  if (data.status !== undefined) updatePayload.status = data.status
  if (data.issue_date !== undefined) updatePayload.issue_date = data.issue_date
  if (data.due_date !== undefined) updatePayload.due_date = data.due_date
  if (data.tax_rate !== undefined) updatePayload.tax_rate = data.tax_rate
  if (data.notes !== undefined) updatePayload.notes = data.notes
  if (data.terms !== undefined) updatePayload.terms = data.terms
  if (totals) {
    updatePayload.subtotal = totals.subtotal
    updatePayload.tax_amount = totals.taxAmount
    updatePayload.total = totals.total
  }

  const { error: updErr } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoiceId)
  if (updErr) throw updErr

  // If line items were provided, delete all existing and reinsert
  if (data.line_items !== undefined) {
    const { error: delErr } = await supabase
      .from('invoice_line_items')
      .delete()
      .eq('invoice_id', invoiceId)
    if (delErr) throw delErr

    if (data.line_items.length > 0) {
      const lineRows = data.line_items.map((li, i) => ({
        invoice_id: invoiceId,
        user_id: userId,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        amount: round2(li.quantity * li.unit_price),
        position: li.position ?? i,
      }))

      const { error: insErr } = await supabase.from('invoice_line_items').insert(lineRows)
      if (insErr) throw insErr
    }
  }

  // Refetch the fresh row with line items
  const fresh = await getInvoice(invoiceId)
  if (!fresh) throw new Error('Invoice disappeared after update')
  return fresh
}

// ---------- Delete ----------

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw error
}

// ---------- Status transitions ----------

export async function markInvoiceSent(invoiceId: string): Promise<Invoice> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: now, updated_at: now })
    .eq('id', invoiceId)
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}

/**
 * Mark an invoice paid MANUALLY (check, ACH, etc). The Stripe path goes through
 * the webhook handler — this function should never be called with method='stripe'
 * from the client.
 */
export async function markInvoicePaid(
  invoiceId: string,
  userId: string,
  amount: number,
  method: 'manual' | 'other',
  notes?: string | null
): Promise<Invoice> {
  const now = new Date().toISOString()

  // Insert the payment row first
  const { error: payErr } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    user_id: userId,
    amount,
    method,
    paid_at: now,
    notes: notes ?? null,
  })
  if (payErr) throw payErr

  // Then flip the invoice status
  const { data, error: updErr } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: now, updated_at: now })
    .eq('id', invoiceId)
    .select()
    .single()

  if (updErr) throw updErr
  return data as Invoice
}

// ---------- Display helpers ----------

/**
 * Derive 'overdue' client-side when an invoice is sent and past its due date.
 * The DB column stays as 'sent' — we don't mutate state on render. A future
 * cron job can promote sent → overdue in the DB if desired.
 */
export function getDisplayStatus(invoice: Invoice): InvoiceStatus {
  if (
    invoice.status === 'sent' &&
    invoice.due_date &&
    new Date(invoice.due_date) < new Date(new Date().toDateString())
  ) {
    return 'overdue'
  }
  return invoice.status
}
