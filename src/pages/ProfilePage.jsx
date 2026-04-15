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
import { User, Mail, Calendar, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, demoMode } = useAuth()

  // Profile form state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // --- Save Changes handler ---
  const handleSaveChanges = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    if (demoMode) {
      toast.success('Profile updated (demo mode)')
      return
    }

    setSavingProfile(true)
    try {
      // 1. Update Supabase Auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })

      if (authError) throw authError

      // 2. Update the profiles table
      const { error: profileError } = await updateProfile(user.id, {
        full_name: fullName.trim(),
      })

      if (profileError) {
        console.warn('Profile table update failed:', profileError.message)
        // Auth metadata was still updated, so we don't throw
      }

      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Save profile error:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // --- Update Password handler ---
  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (demoMode) {
      toast.success('Password updated (demo mode)')
      setCurrentPassword('')
      setNewPassword('')
      return
    }

    setUpdatingPassword(true)
    try {
      // Supabase updateUser for password change
      // Note: Supabase doesn't require the current password for authenticated users,
      // but we keep the field for UX purposes
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error('Update password error:', err)
      toast.error(err.message || 'Failed to update password')
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My <span className="gradient-text">Profile</span></h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {(fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{fullName || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || 'Not signed in'}</p>
              <Badge variant="success" className="mt-1">Active</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
              <Input defaultValue={user?.email || ''} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined</Label>
              <Input value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} disabled className="opacity-60" />
            </div>
          </div>

          <Button className="mt-4" onClick={handleSaveChanges} disabled={savingProfile}>
            {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Current Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">New Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleUpdatePassword} disabled={updatingPassword}>
            {updatingPassword ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
