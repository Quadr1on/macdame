'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check active session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (event === 'SIGNED_IN') {
          // Create user profile if doesn't exist
          await createUserProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // The admin allowlist lives in a server-only env var, so the browser can't
  // evaluate it — ask the server once per signed-in user instead. Deliberately
  // not a NEXT_PUBLIC_ var: that would ship every admin's email in the bundle.
  // Keyed on the id alone: Supabase hands back a fresh user object on every
  // token refresh, and re-fetching on each of those would be pure noise.
  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false)
      return
    }

    let cancelled = false
    fetch('/api/admin/session')
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin))
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }

  async function createUserProfile(user) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Extract name from metadata (supports both email/password and Google OAuth)
        const fullName = user.user_metadata?.full_name 
          || user.user_metadata?.name 
          || ''

        // Create new profile
        const { error } = await supabase
          .from('users_profile')
          .insert([
            {
              id: user.id,
              full_name: fullName,
              phone: user.user_metadata?.phone || '',
            }
          ])

        if (error) throw error
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  async function signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  async function signInWithGoogle(next = '/') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}