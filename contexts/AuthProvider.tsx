'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface UserDetails {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  fullName: string | null
}

interface AuthContextType {
  user: UserDetails | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (firstName: string, lastName: string, email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isSigningUp = useRef(false)

  // Initialize the auth state when the component mounts
  useEffect(() => {
    // Get the current session without clearing it
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        // Check for an active session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error)
          setIsLoading(false)
          return
        }
        
        if (session) {
          setSession(session)
          
          // Get user metadata directly from the session
          const userMetadata = session.user.user_metadata;
          
          // Extract name from user metadata
          const displayName = userMetadata?.name || null;
          const firstName = userMetadata?.first_name || null;
          const lastName = userMetadata?.last_name || null;
          const fullName = displayName || 
                          (firstName && lastName ? `${firstName} ${lastName}` : 
                          firstName ? firstName : 
                          lastName ? lastName : null);
            
          setUser({
            id: session.user.id,
            name: displayName || (session.user.email ? session.user.email.split('@')[0] : null) || 'User',
            firstName,
            lastName,
            fullName,
            email: session.user.email || null
          })
        }
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Skip all auth state changes during signup to prevent flash redirects
        if (isSigningUp.current) return

        setSession(currentSession)
        
        if (event === 'SIGNED_IN' && currentSession) {
          // Get user metadata directly from the session
          const userMetadata = currentSession.user.user_metadata;
          
          // Extract name from user metadata
          const displayName = userMetadata?.name || null;
          const firstName = userMetadata?.first_name || null;
          const lastName = userMetadata?.last_name || null;
          const fullName = displayName || 
                          (firstName && lastName ? `${firstName} ${lastName}` : 
                          firstName ? firstName : 
                          lastName ? lastName : null);
            
          setUser({
            id: currentSession.user.id,
            name: displayName || (currentSession.user.email ? currentSession.user.email.split('@')[0] : null) || 'User',
            firstName,
            lastName,
            fullName,
            email: currentSession.user.email || null
          })
          
          setIsLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsLoading(false)
        }
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)

    console.log('[Auth] Attempting sign in for:', email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })

    if (error) {
      console.error('[Auth] Sign in error:', error.message, error.status, JSON.stringify(error))
    } else {
      console.log('[Auth] Sign in success, user:', data?.user?.id)
    }

    setIsLoading(false)
    return { error }
  }


  // Sign up with email and password
  const signUp = async (firstName: string, lastName: string, email: string, password: string) => {
    setIsLoading(true)
    
    try {
      console.log('[Auth] Attempting sign up for:', email)
      isSigningUp.current = true

      // Create the user account
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`
          }
        }
      })

      if (error) {
        console.error('[Auth] Sign up error:', error.message, error.status, JSON.stringify(error))
        isSigningUp.current = false
        setIsLoading(false)
        return { error }
      }

      console.log('[Auth] Sign up response:', {
        userId: data?.user?.id,
        emailConfirmedAt: data?.user?.email_confirmed_at,
        identities: data?.user?.identities?.length,
        session: !!data?.session,
      })

      // Check if email confirmation is required (no session returned)
      if (data?.user && !data?.session) {
        console.log('[Auth] Email confirmation required — no session returned')
        setIsLoading(false)
        return {
          error: {
            message: 'Check your email for a confirmation link, then sign in.',
          },
          needsConfirmation: true,
        }
      }

      // Check if user already exists (identities array is empty)
      if (data?.user?.identities?.length === 0) {
        console.log('[Auth] User already exists')
        setIsLoading(false)
        return {
          error: { message: 'An account with this email already exists. Please sign in.' },
        }
      }
      
      if (data?.user) {
        // Create a profile entry for the user
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              name: `${firstName} ${lastName}`,
              updated_at: new Date().toISOString()
            })
            
          if (profileError) {
            console.error('[Auth] Error creating profile:', profileError)
          } else {
            console.log('[Auth] Profile created successfully')
          }
        } catch (profileError) {
          console.error('[Auth] Error creating profile:', profileError)
        }
      }
      
      // Sign out immediately so user can log in fresh via the login page
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      isSigningUp.current = false
      setIsLoading(false)
      return { error: null }
    } catch (err) {
      console.error('[Auth] Signup exception:', err)
      isSigningUp.current = false
      setIsLoading(false)
      return { error: { message: err instanceof Error ? err.message : 'An unexpected error occurred during signup' } }
    }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
