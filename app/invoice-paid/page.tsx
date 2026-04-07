'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function InvoicePaidContent() {
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
        <Card className="border-warm-200 shadow-warm">
          <CardContent className="pt-10 pb-8 px-8 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                damping: 12,
                stiffness: 180,
                delay: 0.2,
              }}
              className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-2">
              Payment received
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Thank you. Your payment has been processed successfully. Your designer
              will follow up with a receipt and next steps.
            </p>

            {invoiceNumber && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Reference
                </div>
                <div className="font-mono text-sm text-foreground">{invoiceNumber}</div>
              </div>
            )}

            <p className="mt-8 text-xs text-muted-foreground/70">
              You can safely close this tab.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function InvoicePaidPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 className="h-6 w-6 animate-spin text-warm-600" />
        </div>
      }
    >
      <InvoicePaidContent />
    </Suspense>
  )
}
