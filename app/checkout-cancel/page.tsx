'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Info, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function CheckoutCancelPage() {
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
              No changes made
            </h1>
            <p className="text-muted-foreground mb-7 leading-relaxed">
              Your subscription is unchanged. You can upgrade whenever you&apos;re ready.
            </p>

            <div className="space-y-3">
              <Link href="/pricing" className="block">
                <Button variant="warm" size="lg" className="w-full">
                  Back to pricing
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
