import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if there is an error in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const errorDesc = hashParams.get('error_description')
    const type = hashParams.get('type')
    
    if (errorDesc) {
      setError(errorDesc.replace(/\+/g, ' '))
      return
    }

    // If this is a password recovery link, redirect to the reset password page
    if (type === 'recovery') {
      // Give AuthContext time to process the session, then go to reset page
      const timer = setTimeout(() => {
        navigate('/forgot-password?step=reset', { replace: true })
      }, 1000)
      return () => clearTimeout(timer)
    }

    // Wait a brief moment to allow AuthContext to process the session via onAuthStateChange
    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard', { replace: true })
      } else {
        // If no user after 2 seconds and no explicit error, redirect to login
        navigate('/login', { replace: true })
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10 text-center p-8 rounded-2xl border border-border bg-card shadow-2xl"
      >
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button onClick={() => navigate('/login')} className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 rounded-md font-medium transition-colors">
              Go to Login
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              {user ? (
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              ) : (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {user ? 'Email Verified Successfully!' : 'Verifying your email...'}
            </h2>
            <p className="text-muted-foreground">
              {user ? 'Redirecting you to dashboard...' : 'Please wait a moment while we confirm your email address.'}
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
