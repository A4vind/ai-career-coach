import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Mail, Lock, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { resetPasswordRequest, verifyPasswordResetCode, updateUserPassword } = useAuth()
  const navigate = useNavigate()

  // If user came via the email magic link (AuthCallback redirected here with ?step=reset),
  // they are already authenticated — jump straight to entering a new password.
  useEffect(() => {
    if (searchParams.get('step') === 'reset') {
      setStep(3)
    }
  }, [searchParams])
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onRequestCode = async (data) => {
    setLoading(true)
    setError('')
    const { error: reqError } = await resetPasswordRequest(data.email)
    if (reqError) {
      // Give a friendly message if the email is not registered
      if (reqError.message?.toLowerCase().includes('user') || reqError.status === 422) {
        setError('No account found with this email address. Please check and try again.')
      } else {
        setError(reqError.message)
      }
      setLoading(false)
    } else {
      setEmail(data.email)
      setStep(2)
      setLoading(false)
      toast.success('A 6-digit code has been sent to your email')
    }
  }

  const onVerifyCode = async (data) => {
    setLoading(true)
    setError('')
    const { error: verifyError } = await verifyPasswordResetCode(email, data.code)
    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
    } else {
      setStep(3)
      setLoading(false)
      toast.success("Code verified successfully")
    }
  }

  const onResetPassword = async (data) => {
    setLoading(true)
    setError('')
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }
    const { error: updateError } = await updateUserPassword(data.password)
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setStep(4)
      setLoading(false)
      toast.success("Password reset successfully")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AI Career Pro</span>
          </Link>
        </div>

        <Card className="border-border/50 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Reset Password"}
              {step === 2 && "Enter Code"}
              {step === 3 && "New Password"}
              {step === 4 && "All Done!"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your email to receive a verification code"}
              {step === 2 && `We sent a 6-digit code to ${email}`}
              {step === 3 && "Secure your account with a new password"}
              {step === 4 && "Your password has been successfully reset"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {step === 1 && (
              <form onSubmit={handleSubmit(onRequestCode)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...register('email', { required: 'Email is required' })}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : "Send Code"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit(onVerifyCode)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="12345678"
                      className="pl-10 tracking-widest"
                      maxLength={8}
                      {...register('code', { required: 'Code is required', minLength: { value: 8, message: '8-digit code is required' } })}
                    />
                  </div>
                  {errors.code && <p className="text-xs text-destructive">{errors.code.message || '8-digit code is required'}</p>}
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : "Verify Code"}
                </Button>
                <Button variant="ghost" type="button" className="w-full" onClick={() => setStep(1)} disabled={loading}>
                  Use a different email
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit(onResetPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...register('confirmPassword', { required: 'Please confirm your password' })}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : "Update Password"}
                </Button>
              </form>
            )}

            {step === 4 && (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-muted-foreground pb-4">You can now use your new password to log in to your account.</p>
                <Button className="w-full" onClick={() => navigate('/login')}>
                  Return to Login
                </Button>
              </div>
            )}

            {step !== 4 && (
              <p className="text-center text-sm text-muted-foreground mt-6">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
