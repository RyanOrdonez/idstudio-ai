'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        const msg = error?.message || JSON.stringify(error) || 'Unknown error'
        console.error('[Login] Error:', msg, error)

        if (msg.includes('Invalid login') || msg.includes('Invalid email or password')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
          setError('Please confirm your email address before logging in. Check your inbox for a confirmation link.')
        } else if (msg.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a moment.')
        } else {
          setError(msg)
        }
        setIsSubmitting(false)
        return
      }
      
      setSuccess('Welcome back! Redirecting to your dashboard...')
      redirectTimer.current = setTimeout(() => { router.push('/dashboard') }, 1200)
      
    } catch (err: unknown) {
      console.error('[Login] Exception:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-warm-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warm-900 via-warm-800 to-warm-700 opacity-90" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md px-12 text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <span className="text-2xl font-bold text-white font-serif">ID</span>
            </div>
          </div>
          <h2 className="text-3xl font-serif font-semibold text-white mb-4">
            Design smarter, not harder.
          </h2>
          <p className="text-warm-300 text-sm leading-relaxed">
            IDStudio is your AI-powered command center for running a premium interior design business — from mood boards to invoices.
          </p>
        </motion.div>
      </div>

      {/* Right — Login form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
              <span className="text-lg font-bold text-primary-foreground font-serif">ID</span>
            </div>
          </div>

          <Card className="shadow-soft-lg border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {justRegistered && !error && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 mb-4">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Account created successfully! Sign in to get started.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...</>
                  ) : success ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Success!</>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
