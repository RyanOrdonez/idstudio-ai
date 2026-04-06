'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'

type SettingsTab = 'profile' | 'account' | 'notifications' | 'billing'

export default function DashboardSettings() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
  })

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

  const pricingTiers = [
    {
      name: 'Solo',
      price: 49,
      features: ['Up to 10 active projects', 'AI Assistant', 'Client Management', '5 GB Storage', 'Email Support'],
      popular: false,
    },
    {
      name: 'Studio',
      price: 149,
      features: ['Unlimited projects', 'Advanced AI Features', 'Document Generation', '50 GB Storage', 'Priority Support', 'Client Portal'],
      popular: true,
    },
    {
      name: 'Agency',
      price: 299,
      features: ['Everything in Studio', 'Team Collaboration', '200 GB Storage', 'Custom Branding', 'API Access', 'Dedicated Account Manager'],
      popular: false,
    },
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
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You&apos;re currently on the Free plan</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingTiers.map((tier) => (
                    <Card
                      key={tier.name}
                      className={`relative ${tier.popular ? 'border-primary shadow-soft-md' : ''}`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="gap-1">
                            <Sparkles className="h-3 w-3" /> Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        <p className="text-2xl font-bold text-foreground">
                          ${tier.price}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full"
                          variant={tier.popular ? 'default' : 'outline'}
                        >
                          Upgrade to {tier.name}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
