'use client'

import { motion } from 'framer-motion'
import { Receipt, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function FinancialsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-foreground">Financials</h1>
          <p className="text-muted-foreground mt-1">Invoicing, expense tracking, and financial reporting</p>
        </div>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm">
              Create invoices, track expenses, manage budgets, and generate financial reports for your design projects.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground/60">
              <Lock className="h-3.5 w-3.5" />
              In development
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
