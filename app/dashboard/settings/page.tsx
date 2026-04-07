'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useCredits } from '@/hooks/useCredits'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import PricingCards from '@/components/PricingCards'
import {
  User,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

type SettingsTab = 'profile' | 'account' | 'notifications' | 'billing'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Professional',
  studio: 'Studio',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past due',
  canceled: 'Canceled',
}

const STATUS_VARIANT: Record<string, 'success' | 'warm' | 'destructive' | 'secondary'> = {
  active: 'success',
  trialing: 'warm',
  past_due: 'destructive',
  canceled: 'secondary',
}

function daysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null
  const target = new Date(isoDate).getTime()
  const now = Date.now()
  if (Number.isNaN(target)) return null
  const diffMs = target - now
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export default function DashboardSettings() {
  const { user, signOut } = useAuth()
  const { subscription, isLoading: isSubLoading } = useSubscription()
  const { creditStatus, isLoading: isCreditsLoading } = useCredits()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isBillingPortalLoading, setIsBillingPortalLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
  })

  const handleManageBilling = async () => {
    setBillingError(null)
    setIsBillingPortalLoading(true)
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/settings`,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to open billing portal (${res.status})`)
      }
      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open billing portal'
      setBillingError(msg)
      setIsBillingPortalLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
        company: '',
        bio: '',
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          company: formData.company,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch {
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMessage(null) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Jane"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={formData.email} disabled className="opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your design studio name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Tell us about yourself and your design expertise..."
                    />
                  </div>

                  {message && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                        message.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-destructive/10 border border-destructive/20 text-destructive'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      {message.text}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          phone: '',
                          company: '',
                          bio: '',
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>Manage your account security and session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Sign Out</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      End your current session. You&apos;ll need to log in again.
                    </p>
                    <Button variant="destructive" onClick={() => signOut()} className="gap-2">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what updates you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { title: 'Email Notifications', desc: 'Receive updates about your projects and clients', default: true },
                    { title: 'Project Updates', desc: 'Get notified when projects are updated', default: false },
                    { title: 'Client Messages', desc: 'Notifications for new client communications', default: true },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          item.default ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            item.default ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Current plan header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription className="mt-1">
                          {isSubLoading
                            ? 'Loading subscription details…'
                            : subscription
                              ? `You're on the ${PLAN_LABELS[subscription.plan_type] ?? subscription.plan_type} plan.`
                              : 'No active subscription.'}
                        </CardDescription>
                      </div>
                      {!isSubLoading && subscription && (
                        <Badge
                          variant={STATUS_VARIANT[subscription.status] ?? 'secondary'}
                          className="text-xs"
                        >
                          {STATUS_LABELS[subscription.status] ?? subscription.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Trial countdown */}
                    {subscription?.status === 'trialing' &&
                      (() => {
                        const trialEnd =
                          subscription.trial_end ?? subscription.current_period_end
                        const days = daysUntil(trialEnd)
                        if (days === null) return null
                        return (
                          <div className="rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900">
                            {days === 0
                              ? 'Your trial ends today. Upgrade below to keep access.'
                              : `Your trial ends in ${days} day${days === 1 ? '' : 's'}. Upgrade below to keep access after that.`}
                          </div>
                        )
                      })()}

                    {/* Credit usage strip */}
                    {!isCreditsLoading && creditStatus && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">AI credits this week</span>
                          <span className="font-medium text-foreground">
                            {creditStatus.unlimited
                              ? 'Unlimited'
                              : `${creditStatus.creditsUsed} / ${creditStatus.weeklyLimit}`}
                          </span>
                        </div>
                        {!creditStatus.unlimited && (
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-warm-600 transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (creditStatus.creditsUsed /
                                    Math.max(creditStatus.weeklyLimit, 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manage Billing button — only when there's a Stripe customer on file */}
                    {subscription?.stripe_customer_id && (
                      <div className="pt-2 flex items-center gap-3 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={handleManageBilling}
                          disabled={isBillingPortalLoading}
                          className="gap-2"
                        >
                          {isBillingPortalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                          Manage billing
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Update payment method, download invoices, or cancel.
                        </span>
                      </div>
                    )}

                    {billingError && (
                      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        {billingError}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upgrade / switch cards */}
                <div className="pt-4">
                  <PricingCards />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
