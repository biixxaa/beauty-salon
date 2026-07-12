// src/components/EmployeeProfileForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, FileText, Camera, Save, Lock, RefreshCw, AlertCircle } from 'lucide-react';

interface EmployeeProfile {
  id: string;
  name: string;
  bio?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  rating: number;
  user: {
    email: string;
    phone?: string;
  };
  salon: {
    id: string;
    name: string;
  };
}

export default function EmployeeProfileForm() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  const [formData, setFormData] = useState({
    bio: '',
    resumeUrl: '',
    avatarUrl: '',
  });

  // Fetch employee profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile/employee');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
        setFormData({
          bio: data.bio || '',
          resumeUrl: data.resumeUrl || '',
          avatarUrl: data.avatarUrl || '',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile/employee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setProfile(data);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
      setShowPasswordForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 flex gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm font-bold">Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 text-sm bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <User className="h-5 w-5 text-amber-500" />
            Profile Information
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Name</p>
              <p className="text-sm text-zinc-950 dark:text-zinc-50">{profile.name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Email</p>
              <p className="text-sm text-zinc-950 dark:text-zinc-50">{profile.user.email}</p>
            </div>
            {profile.user.phone && (
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Phone</p>
                <p className="text-sm text-zinc-950 dark:text-zinc-50">{profile.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Salon</p>
              <p className="text-sm text-zinc-950 dark:text-zinc-50">{profile.salon.name}</p>
            </div>
            {profile.rating > 0 && (
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Rating</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">⭐ {profile.rating.toFixed(1)}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Bio</p>
              <p className="text-sm text-zinc-950 dark:text-zinc-50">{profile.bio || 'No bio added'}</p>
            </div>
            {profile.resumeUrl && (
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase mb-1">Resume</p>
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  View Resume
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Add a brief bio about yourself and your experience"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50"
                rows={4}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Resume/CV URL</label>
              <input
                type="url"
                value={formData.resumeUrl}
                onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                placeholder="https://example.com/my-resume.pdf"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50"
              />
              <p className="text-xs text-zinc-500 mt-1">Upload your resume to a cloud service and paste the URL here</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white font-bold rounded-lg transition-colors"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password Section */}
      <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Security
          </h2>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-3 py-1 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Change Password
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Current Password</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950">
                <input
                  type={passwordForm.showCurrent ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter your current password"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setPasswordForm({
                      ...passwordForm,
                      showCurrent: !passwordForm.showCurrent,
                    })
                  }
                  className="text-zinc-450 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {passwordForm.showCurrent ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">New Password</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950">
                <input
                  type={passwordForm.showNew ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Enter new password (min. 6 characters)"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setPasswordForm({
                      ...passwordForm,
                      showNew: !passwordForm.showNew,
                    })
                  }
                  className="text-zinc-450 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {passwordForm.showNew ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Confirm New Password</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg dark:bg-zinc-950">
                <input
                  type={passwordForm.showConfirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="flex-1 bg-transparent text-sm focus:outline-none text-zinc-950 dark:text-zinc-50"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setPasswordForm({
                      ...passwordForm,
                      showConfirm: !passwordForm.showConfirm,
                    })
                  }
                  className="text-zinc-450 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {passwordForm.showConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
