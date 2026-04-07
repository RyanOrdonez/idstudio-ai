'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/stripe'
import { useSubscription } from '@/hooks/useSubscription'
import { redirectToCheckout } from '@/lib/checkout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Subscription } from '@/lib/subscription'

type PlanKey = 'starter' | 'pro'

interface ButtonState {
  kind: 'current' | 'upgrade' | 'switch' | 'start'
  label: string
  disabled: boolean
}

function getButtonState(
  cardPlan: PlanKey,
  subscription: Subscription | null
): ButtonState {
  const cardLabel = PRICING_PLANS[cardPlan].name

  // No subscription at all, or explicitly on free tier.
  if (!subscription || subscription.plan_type === 'free') {
    return { kind: 'start', label: `Start ${cardLabel}`, disabled: false }
  }

  // Currently paid + active on THIS plan → disabled "Current plan"
  if (subscription.plan_type === cardPlan && subscription.status === 'active') {
    return { kind: 'current', label: 'Current plan', disabled: true }
  }

  // Trialing on any plan → upgrade path (converts trial to paid)
  if (subscription.status === 'trialing') {
    return { kind: 'upgrade', label: `Upgrade to ${cardLabel}`, disabled: false }
  }

  // Active on a different paid plan → switch
  if (subscription.status === 'active') {
    return { kind: 'switch', label: `Switch to ${cardLabel}`, disabled: false }
  }

  // past_due / canceled → treat as fresh start
  return { kind: 'start', label: `Start ${cardLabel}`, disabled: false }
}

interface PricingCardProps {
  planKey: PlanKey
  subscription: Subscription | null
  isSubLoading: boolean
  isCheckoutLoading: boolean
  onCheckout: (planKey: PlanKey) => void
  delay: number
  popular?: boolean
}

function PricingCard({
  planKey,
  subscription,
  isSubLoading,
  isCheckoutLoading,
  onCheckout,
  delay,
  popular = false,
}: PricingCardProps) {
  const plan = PRICING_PLANS[planKey]
  const state = getButtonState(planKey, subscription)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative"
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="warm" className="gap-1 px-3 py-1">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}
      <Card
        className={`h-full flex flex-col ${
          popular ? 'border-warm-600 shadow-warm' : 'border-border'
        }`}
      >
        <CardHeader className="pb-4">
          <h3 className="text-xl font-serif font-semibold text-foreground">
            {plan.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-semibold text-foreground tracking-tight">
              ${plan.price}
            </span>
            <span className="text-sm text-muted-foreground">/ month</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ul className="space-y-3 mb-6 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check className="h-4 w-4 text-warm-600 shrink-0 mt-0.5" />
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            variant={popular ? 'warm' : 'outline'}
            size="lg"
            className="w-full"
            disabled={state.disabled || isSubLoading || isCheckoutLoading}
            onClick={() => onCheckout(planKey)}
          >
            {isSubLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading…
              </>
            ) : isCheckoutLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Redirecting…
              </>
            ) : (
              state.label
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function PricingCards() {
  const { subscription, isLoading: isSubLoading } = useSubscription()
  const [checkoutLoadingFor, setCheckoutLoadingFor] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (planKey: PlanKey) => {
    setError(null)
    setCheckoutLoadingFor(planKey)
    try {
      await redirectToCheckout(PRICING_PLANS[planKey].priceId as string, planKey)
      // On success the browser redirects away, so code below shouldn't run.
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start checkout'
      setError(msg)
      setCheckoutLoadingFor(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-foreground">
          Simple, honest pricing
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Start with a 14-day trial of every feature. Upgrade anytime. Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
        <PricingCard
          planKey="starter"
          subscription={subscription}
          isSubLoading={isSubLoading}
          isCheckoutLoading={checkoutLoadingFor === 'starter'}
          onCheckout={handleCheckout}
          delay={0}
        />
        <PricingCard
          planKey="pro"
          subscription={subscription}
          isSubLoading={isSubLoading}
          isCheckoutLoading={checkoutLoadingFor === 'pro'}
          onCheckout={handleCheckout}
          delay={0.08}
          popular
        />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mt-6"
        >
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
