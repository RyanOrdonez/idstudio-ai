'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Info, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function InvoiceCanceledContent() {
  const searchParams = useSearchParams()
  const invoiceNumber = searchParams.get('invoice')

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border">
          <CardContent className="pt-10 pb-8 px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 14,
                stiffness: 180,
                delay: 0.15,
              }}
              className="mx-auto h-16 w-16 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mb-6"
            >
              <Info className="h-8 w-8 text-stone-600" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
              Payment canceled
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              No charges were made. You can close this tab and try again when you&apos;re
              ready, or reach out to your designer if you need help.
            </p>

            {invoiceNumber && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Reference
                </div>
                <div className="font-mono text-sm text-foreground">{invoiceNumber}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function InvoiceCanceledPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 className="h-6 w-6 animate-spin text-warm-600" />
        </div>
      }
    >
      <InvoiceCanceledContent />
    </Suspense>
  )
}
