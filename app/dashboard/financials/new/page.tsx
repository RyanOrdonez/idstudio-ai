'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { createInvoice, type CreateInvoiceInput } from '@/lib/invoices'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleSubmit = async (input: CreateInvoiceInput) => {
    if (!user) throw new Error('You must be signed in to create invoices.')
    const created = await createInvoice(user.id, input)
    router.push(`/dashboard/financials/${created.id}`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/financials')}
              className="gap-2 -ml-2 mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invoices
            </Button>
            <h1 className="text-3xl font-serif font-semibold text-foreground">
              New invoice
            </h1>
            <p className="text-muted-foreground mt-1">
              Add line items, select a client, set the tax rate, and save.
            </p>
          </div>

          <InvoiceForm
            mode="create"
            onSubmit={handleSubmit as (input: CreateInvoiceInput | import('@/lib/invoices').UpdateInvoiceInput) => Promise<void>}
            onCancel={() => router.push('/dashboard/financials')}
          />
        </motion.div>
      </div>
    </div>
  )
}
