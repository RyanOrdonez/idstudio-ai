'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signUp, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const { error } = await signUp(firstName, lastName, email, password)
      
      if (error) {
        const msg = error?.message || JSON.stringify(error) || 'Unknown error'
        if (msg.includes('already') || msg.includes('email already in use')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (msg.includes('weak password')) {
          setError('Password is too weak. Please use a stronger password.')
        } else {
          setError(msg)
        }
        return
      }

      router.push('/login?registered=true')
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
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
            Your design business, elevated.
          </h2>
          <p className="text-warm-300 text-sm leading-relaxed">
            Join thousands of interior designers who use IDStudio to manage clients, create stunning mood boards, and grow their business with AI.
          </p>
        </motion.div>
      </div>

      {/* Right — Signup form */}
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
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Start your free trial — no credit card required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                    />
                  </div>
                </div>

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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                  />
                </div>

                {success && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {success}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !!success}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account...</>
                  ) : success ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Account created!</>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
