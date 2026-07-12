// src/components/StaffManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Download, Trash2, Edit2, RefreshCw } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  userId: string;
  email: string;
  phone?: string;
  bio?: string;
  resumeUrl?: string;
  rating: number;
  isAvailable: boolean;
}

interface StaffManagerProps {
  salonId: string;
}

export default function StaffManager({ salonId }: StaffManagerProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });

  // Fetch staff members
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch(`/api/dashboard/employees?salonId=${salonId}`);
        if (!res.ok) throw new Error('Failed to fetch staff');
        const data = await res.json();
        setStaff(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || 'Failed to fetch staff');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [salonId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/dashboard/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add staff');

      setSuccess(`Staff added successfully! Credentials: ${data.credentials.email} / ${data.credentials.password}`);
      setFormData({ name: '', email: '', phone: '', bio: '' });
      setShowForm(false);

      // Refresh staff list
      const updatedRes = await fetch(`/api/dashboard/employees?salonId=${salonId}`);
      const updatedData = await updatedRes.json();
      setStaff(updatedData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to add staff');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-amber-500" />
          <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Staff Members</h2>
          <span className="px-2 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
            {staff.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg font-bold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
          {success}
        </div>
      )}

      {/* Add Staff Form */}
      {showForm && (
        <form
          onSubmit={handleAddStaff}
          className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <textarea
            placeholder="Bio (optional)"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Staff List */}
      <div className="space-y-2">
        {staff.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
            <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No staff members yet. Add your first team member!</p>
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member.id}
              className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-950 dark:text-zinc-50">{member.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</p>
                  {member.phone && <p className="text-xs text-zinc-500 dark:text-zinc-400">{member.phone}</p>}
                  {member.bio && <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{member.bio}</p>}
                  <div className="flex gap-4 mt-2">
                    <span className={`text-xs font-bold ${member.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {member.isAvailable ? '✓ Available' : '✗ Not Available'}
                    </span>
                    {member.rating > 0 && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        ⭐ {member.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {member.resumeUrl && (
                    <a
                      href={member.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
