/**
 * InvoicePDF — React component rendered to a PDF via @react-pdf/renderer.
 * Used by /api/invoices/[id]/pdf/route.tsx to generate the downloadable PDF.
 *
 * Uses Helvetica (built into react-pdf — no font registration needed) for v1.
 * Playfair Display can be added later via `Font.register` in a follow-up.
 *
 * Design tokens are hardcoded HEX values (not Tailwind classes) because
 * react-pdf's StyleSheet doesn't interoperate with Tailwind. Colors mirror
 * the warm-neutral palette.
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceWithItems } from '@/lib/invoices'

interface ProfileSlim {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
}

interface ClientSlim {
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

interface ProjectSlim {
  project_name: string | null
  street_address: string | null
  city: string | null
  state: string | null
  zipcode: string | null
}

export interface InvoicePDFProps {
  invoice: InvoiceWithItems
  profile: ProfileSlim | null
  client: ClientSlim | null
  project: ProjectSlim | null
}

const TOKEN = {
  text: '#3A352E', // stone-900
  textMuted: '#6B6358', // stone-700
  textLight: '#A69E93', // stone-500
  accent: '#B58A45', // accent gold
  bgCream: '#FBF8F3', // cream-100
  divider: '#E8E4DD', // stone-200
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TOKEN.text,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  brandBlock: {
    width: '50%',
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.text,
    marginBottom: 4,
  },
  brandLine: {
    fontSize: 9,
    color: TOKEN.textMuted,
    marginBottom: 2,
  },
  metaBlock: {
    width: '40%',
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.accent,
    marginBottom: 8,
    letterSpacing: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaKey: {
    fontSize: 9,
    color: TOKEN.textMuted,
    width: 80,
    textAlign: 'right',
    marginRight: 8,
  },
  metaVal: {
    fontSize: 9,
    color: TOKEN.text,
    fontFamily: 'Helvetica-Bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: TOKEN.divider,
    marginVertical: 16,
  },
  billTo: {
    marginBottom: 24,
  },
  billToLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  billToName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.text,
    marginBottom: 2,
  },
  billToLine: {
    fontSize: 9,
    color: TOKEN.textMuted,
    marginBottom: 1,
  },
  projectLine: {
    fontSize: 9,
    color: TOKEN.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: TOKEN.bgCream,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: TOKEN.divider,
  },
  th: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  thDescription: { flex: 5 },
  thQty: { flex: 1, textAlign: 'right' },
  thUnit: { flex: 1.5, textAlign: 'right' },
  thAmount: { flex: 1.5, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: TOKEN.divider,
  },
  td: { fontSize: 10, color: TOKEN.text },
  tdDescription: { flex: 5 },
  tdQty: { flex: 1, textAlign: 'right' },
  tdUnit: { flex: 1.5, textAlign: 'right' },
  tdAmount: { flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsBlock: {
    marginTop: 16,
    alignSelf: 'flex-end',
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 10, color: TOKEN.textMuted },
  totalVal: { fontSize: 10, color: TOKEN.text, fontFamily: 'Helvetica-Bold' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: TOKEN.accent,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.text,
  },
  grandTotalVal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.accent,
  },
  notesBlock: {
    marginTop: 32,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TOKEN.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: TOKEN.textMuted,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    fontSize: 8,
    color: TOKEN.textLight,
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: TOKEN.divider,
    paddingTop: 8,
  },
})

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function InvoicePDF({ invoice, profile, client, project }: InvoicePDFProps) {
  const brandName =
    profile?.company_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    '(Your Company)'

  const projectAddr = project
    ? [project.street_address, project.city, project.state, project.zipcode]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>{brandName}</Text>
            {profile?.email && <Text style={styles.brandLine}>{profile.email}</Text>}
            {profile?.phone && <Text style={styles.brandLine}>{profile.phone}</Text>}
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>INVOICE</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Number</Text>
              <Text style={styles.metaVal}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Issued</Text>
              <Text style={styles.metaVal}>{fmtDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Due</Text>
              <Text style={styles.metaVal}>{fmtDate(invoice.due_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Status</Text>
              <Text style={styles.metaVal}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.billToLabel}>Bill To</Text>
          {client ? (
            <>
              <Text style={styles.billToName}>{client.name}</Text>
              {client.email && <Text style={styles.billToLine}>{client.email}</Text>}
              {client.phone && <Text style={styles.billToLine}>{client.phone}</Text>}
              {client.address && <Text style={styles.billToLine}>{client.address}</Text>}
            </>
          ) : (
            <Text style={styles.billToLine}>(no client linked)</Text>
          )}
          {projectAddr && (
            <Text style={styles.projectLine}>
              Project: {project?.project_name || ''} — {projectAddr}
            </Text>
          )}
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thDescription]}>Description</Text>
            <Text style={[styles.th, styles.thQty]}>Qty</Text>
            <Text style={[styles.th, styles.thUnit]}>Unit Price</Text>
            <Text style={[styles.th, styles.thAmount]}>Amount</Text>
          </View>
          {invoice.line_items.map((li) => (
            <View key={li.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.tdDescription]}>{li.description}</Text>
              <Text style={[styles.td, styles.tdQty]}>{li.quantity}</Text>
              <Text style={[styles.td, styles.tdUnit]}>{fmtMoney(li.unit_price)}</Text>
              <Text style={[styles.td, styles.tdAmount]}>{fmtMoney(li.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalVal}>{fmtMoney(invoice.subtotal)}</Text>
          </View>
          {invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({(invoice.tax_rate * 100).toFixed(2)}%)
              </Text>
              <Text style={styles.totalVal}>{fmtMoney(invoice.tax_amount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalVal}>{fmtMoney(invoice.total)}</Text>
          </View>
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notesBlock}>
            {invoice.notes && (
              <>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={[styles.notesText, { marginBottom: 12 }]}>{invoice.notes}</Text>
              </>
            )}
            {invoice.terms && (
              <>
                <Text style={styles.notesLabel}>Payment Terms</Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Generated by IDStudio.ai · {brandName}
        </Text>
      </Page>
    </Document>
  )
}
