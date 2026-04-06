import { useAuth as useAuthContext } from '@/contexts/AuthProvider'

// Re-export the useAuth hook for easier imports
export const useAuth = useAuthContext

// Additional auth-related utilities
export const useRequireAuth = () => {
  const auth = useAuth()
  
  return {
    ...auth,
    // Returns true if the user is authenticated and not loading
    isAuthenticated: !auth.isLoading && !!auth.user
  }
}

// TODO: Add hooks for password reset, email verification, etc. as needed
