'use client'

import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus, Invoice } from '@/lib/invoices'
import { getDisplayStatus } from '@/lib/invoices'

type BadgeVariant = 'default' | 'secondary' | 'warm' | 'success' | 'destructive' | 'outline'

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { variant: BadgeVariant; label: string }
> = {
  draft: { variant: 'secondary', label: 'Draft' },
  sent: { variant: 'warm', label: 'Sent' },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'destructive', label: 'Overdue' },
  canceled: { variant: 'secondary', label: 'Canceled' },
}

export function InvoiceStatusBadge({
  invoice,
  status,
}: {
  invoice?: Invoice
  status?: InvoiceStatus
}) {
  const resolved: InvoiceStatus = invoice ? getDisplayStatus(invoice) : status ?? 'draft'
  const cfg = STATUS_CONFIG[resolved]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
