import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return url && key && !url.includes('your-project') && !key.includes('your-anon-key')
}

// Demo user for when Supabase isn't configured
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@aicareerpro.com',
  user_metadata: { full_name: 'Demo User' },
  created_at: new Date().toISOString(),
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode: auto-login with demo user
      console.log('⚡ Supabase not configured — running in DEMO MODE')
      setDemoMode(true)
      setUser(DEMO_USER)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, fullName) => {
    if (demoMode) {
      setUser({ ...DEMO_USER, email, user_metadata: { full_name: fullName } })
      return { data: { user: DEMO_USER }, error: null }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    
    // If signup successful, manually create the profile to avoid trigger issues
    if (data?.user && !error) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      })
    }
    
    return { data, error }
  }

  const signIn = async (email, password) => {
    if (demoMode) {
      setUser({ ...DEMO_USER, email })
      return { data: { user: DEMO_USER }, error: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    if (demoMode) {
      setUser(DEMO_USER) // In demo mode, stay logged in
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPasswordRequest = async (email) => {
    if (demoMode) return { error: null };
    // signInWithOtp sends a real 6-digit OTP code to the email
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }, // only works for existing users
    });
    return { data, error };
  };

  const verifyPasswordResetCode = async (email, token) => {
    if (demoMode) return { error: null };
    // Verify the 6-digit OTP; type 'email' matches what signInWithOtp sends
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return { data, error };
  };

  const updateUserPassword = async (newPassword) => {
    if (demoMode) return { error: null };
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{
      user, loading, demoMode, 
      signUp, signIn, signOut,
      resetPasswordRequest, verifyPasswordResetCode, updateUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}
