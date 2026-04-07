'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { subscription, refetch } = useSubscription()
  const [isWaitingForWebhook, setIsWaitingForWebhook] = useState(true)

  // Lightweight race mitigation: webhooks are async and the DB may not be
  // updated by the time the user lands here. Refetch on mount, again at
  // 2s, and one more time at 5s. After that we give up and render the page.
  useEffect(() => {
    let cancelled = false
    const timers: NodeJS.Timeout[] = []

    const tryRefetch = async () => {
      if (cancelled) return
      await refetch()
    }

    // Immediate refetch
    tryRefetch()

    // +2s
    timers.push(
      setTimeout(() => {
        if (!cancelled) tryRefetch()
      }, 2000)
    )

    // +5s — final attempt, then stop waiting
    timers.push(
      setTimeout(() => {
        if (!cancelled) {
          tryRefetch().finally(() => {
            if (!cancelled) setIsWaitingForWebhook(false)
          })
        }
      }, 5000)
    )

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [refetch])

  const isPaidAndActive =
    subscription?.status === 'active' &&
    (subscription?.plan_type === 'starter' || subscription?.plan_type === 'pro')

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
              You&apos;re upgraded
            </h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {isPaidAndActive
                ? `Your ${subscription?.plan_type === 'pro' ? 'Professional' : 'Starter'} plan is active. Thank you for supporting IDStudio.`
                : 'Payment received. Your new plan is being activated.'}
            </p>

            <Link href="/dashboard" className="block">
              <Button variant="warm" size="lg" className="w-full">
                Go to dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            {!isPaidAndActive && isWaitingForWebhook && (
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Finalizing your subscription…
              </div>
            )}

            {!isPaidAndActive && !isWaitingForWebhook && (
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                Your plan will update within a few moments. You can continue to the
                dashboard in the meantime.
              </p>
            )}

            {sessionId && (
              <p className="mt-6 pt-6 border-t border-border text-[10px] text-muted-foreground/60 font-mono tracking-tight break-all">
                Reference: {sessionId}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 className="h-6 w-6 animate-spin text-warm-600" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
