import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { updateProfile } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Calendar, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function Toast({ type, message, onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all
      ${type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-xs">✕</button>
    </div>
  )
}

export default function ProfilePage() {
  const { user, demoMode } = useAuth()

  // Profile state
  const [fullName, setFullName]     = useState(user?.user_metadata?.full_name || '')
  const [savingProfile, setSaving]  = useState(false)

  // Password state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd]   = useState(false)

  // Toast state
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Save Profile ────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showToast('error', 'Name cannot be empty')
      return
    }

    if (demoMode) {
      showToast('success', 'Profile updated! (Demo mode)')
      return
    }

    setSaving(true)
    try {
      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })
      if (authError) throw authError

      // Update profiles table
      const { error: dbError } = await updateProfile(user.id, { full_name: fullName.trim() })
      if (dbError) throw dbError

      showToast('success', 'Profile updated successfully!')
    } catch (err) {
      showToast('error', err.message || 'Failed to update profile')
    }
    setSaving(false)
  }

  // ── Change Password ─────────────────────────────────────
  const handleChangePassword = async () => {
    if (!newPwd) {
      showToast('error', 'Please enter a new password')
      return
    }
    if (newPwd.length < 6) {
      showToast('error', 'Password must be at least 6 characters')
      return
    }
    if (newPwd !== confirmPwd) {
      showToast('error', 'Passwords do not match')
      return
    }

    if (demoMode) {
      showToast('success', 'Password updated! (Demo mode)')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
      return
    }

    setSavingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      showToast('success', 'Password changed successfully!')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      showToast('error', err.message || 'Failed to change password')
    }
    setSavingPwd(false)
  }

  const initials = (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My <span className="gradient-text">Profile</span></h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </motion.div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Account Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName || user?.email?.split('@')[0] || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not signed in'}</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input value={user?.email || ''} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined
              </Label>
              <Input
                value={user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={savingProfile} className="mt-2 gap-2">
            {savingProfile
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Current Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">New Password</Label>
            <Input
              type="password"
              placeholder="Min. 6 characters"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confirm New Password</Label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
            />
          </div>

          {newPwd && confirmPwd && newPwd !== confirmPwd && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Passwords do not match
            </p>
          )}
          {newPwd && confirmPwd && newPwd === confirmPwd && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Passwords match
            </p>
          )}

          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={savingPwd}
            className="gap-2 mt-1"
          >
            {savingPwd
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
              : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
