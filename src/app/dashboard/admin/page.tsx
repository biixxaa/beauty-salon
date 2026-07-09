// src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Star, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Mail } from 'lucide-react';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [salons, setSalons] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('SALON_OWNER');
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState('7');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user || !['ADMIN', 'SUPER_ADMIN'].includes(userData.user.role)) {
        router.push('/settings?mode=login');
        return;
      }
      setUser(userData.user);

      // Fetch all salons
      const salonsRes = await fetch('/api/salons');
      const salonsData = await salonsRes.json();
      if (Array.isArray(salonsData)) {
        setSalons(salonsData);
      }

      const invitesRes = await fetch('/api/dashboard/invitations');
      const invitesData = await invitesRes.json();
      if (Array.isArray(invitesData)) {
        setInvites(invitesData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifySalon = async (id: string) => {
    setVerifyingId(id);
    try {
      // Find the target salon to get details
      const salonMatch = salons.find((s) => s.id === id);
      if (!salonMatch) return;

      const res = await fetch('/api/dashboard/salons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: salonMatch.id,
          isVerified: true,
        }),
      });

      if (res.ok) {
        alert('Salon verified successfully.');
        fetchAdminData();
      } else {
        alert('Failed to verify salon.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteMessage('');
    setInviteLoading(true);

    try {
      const res = await fetch('/api/dashboard/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: inviteEmail || undefined,
          role: inviteRole,
          expiresInDays: Number(inviteExpiresInDays) || undefined,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setInviteError(payload.error || 'Could not create invitation');
        return;
      }

      setInviteMessage(`Created invitation code ${payload.invitation.code}`);
      setInviteEmail('');
      setInviteExpiresInDays('7');
      setInvites((prev) => [payload.invitation, ...prev]);
    } catch (err) {
      console.error(err);
      setInviteError('Failed to create invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-550 font-bold">Loading admin panel...</span>
      </div>
    );
  }

  const pendingSalons = salons.filter((s) => !s.isVerified);
  const verifiedSalons = salons.filter((s) => s.isVerified);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Admin Operations Panel</h1>
        <p className="text-sm text-zinc-550">Review salon licenses, verify portfolio credentials, and approve business listings</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Total Registered Salons</span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{salons.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Awaiting Verification</span>
          <span className="text-2xl font-extrabold text-amber-500">{pendingSalons.length}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex flex-col gap-1">
          <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Verified Partners</span>
          <span className="text-2xl font-extrabold text-emerald-500">{verifiedSalons.length}</span>
        </div>
      </div>

      {/* Invitation management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Create an Invitation</h2>
              <p className="text-xs text-zinc-500">Generate a salon owner invite code and share it only with trusted partners.</p>
            </div>
          </div>

          {inviteError ? (
            <div className="mb-3 p-3 rounded-2xl bg-red-500/10 text-red-600 text-xs font-bold">{inviteError}</div>
          ) : null}
          {inviteMessage ? (
            <div className="mb-3 p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 text-xs font-bold">{inviteMessage}</div>
          ) : null}

          <form onSubmit={handleCreateInvite} className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase text-zinc-400">Invite Email (optional)</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. owner@example.com"
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="SALON_OWNER">Salon Owner</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Expires in (days)</label>
                <input
                  type="number"
                  value={inviteExpiresInDays}
                  min="1"
                  onChange={(e) => setInviteExpiresInDays(e.target.value)}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-950 px-4 py-3 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={inviteLoading}
              className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {inviteLoading ? 'Generating...' : 'Create Invitation'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mb-4">Recent Invitations</h2>
          {invites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500">
              No invitations have been created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.slice(0, 6).map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-xs bg-zinc-50 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{invite.code}</div>
                      <div className="text-zinc-500 dark:text-zinc-400">Role: {invite.role}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${invite.isUsed ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {invite.isUsed ? 'Used' : 'Unused'}
                    </span>
                  </div>
                  <div className="mt-2 text-zinc-500 dark:text-zinc-400">
                    {invite.targetEmail ? `Email: ${invite.targetEmail}` : 'Email: any'} • Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'No expiry'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Split Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Verification Queue */}
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-5 w-5 text-amber-500" /> Verification Queue ({pendingSalons.length})
          </h3>

          {pendingSalons.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 font-medium">
              No new salon registration requests awaiting credentials validation.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingSalons.map((salon) => (
                <div key={salon.id} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-zinc-150 shrink-0">
                      <Image
                        src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=150'}
                        alt={salon.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{salon.name}</span>
                      <span className="text-zinc-500">Address: {salon.address}</span>
                      <span className="text-zinc-400 font-medium mt-0.5">Owner ID: {salon.ownerId}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerifySalon(salon.id)}
                    disabled={verifyingId === salon.id}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    {verifyingId === salon.id ? 'Verifying...' : 'Verify Salon'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Verified Salon List */}
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Active Verified listings ({verifiedSalons.length})
          </h3>

          {verifiedSalons.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400 font-medium">No verified listings in directory.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {verifiedSalons.map((salon) => (
                <div key={salon.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      <Image
                        src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=150'}
                        alt={salon.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{salon.name}</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
                      </div>
                      <span className="text-zinc-500">{salon.address}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-550/10 px-2 py-1 rounded-lg shrink-0 uppercase tracking-wider">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
