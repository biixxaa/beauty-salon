// src/app/dashboard/customer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Gift, Wallet, Award, RefreshCw, X, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reschedule state modal
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch current profile
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user) {
        router.push('/settings?mode=login');
        return;
      }
      setUser(userData.user);

      // 2. Fetch booking list
      const bookingsRes = await fetch('/api/bookings?role=CUSTOMER');
      const bookingsData = await bookingsRes.json();
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => { void fetchDashboardData(); }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment? Prepaid fees will be refunded to your wallet balance.')) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (res.ok) {
        alert('Booking cancelled and refund processed.');
        fetchDashboardData();
      } else {
        alert('Failed to cancel appointment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleBookingId || !newDate || !newSlot) return;
    setRescheduling(true);

    try {
      const [hour, min] = newSlot.split(':').map(Number);
      const scheduledDateTime = new Date(newDate);
      scheduledDateTime.setHours(hour, min, 0, 0);

      const res = await fetch(`/api/bookings/${rescheduleBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTimeStr: scheduledDateTime.toISOString() }),
      });

      if (res.ok) {
        alert('Rescheduled successfully.');
        setRescheduleBookingId(null);
        setNewDate('');
        setNewSlot('');
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reschedule.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-550 font-bold">Loading dashboard details...</span>
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(b.status));
  const pastBookings = bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status));

  // Auto-generate referral code if none exists
  const myReferralCode = user.profile?.referralCode || `${user.name.split(' ')[0].toUpperCase()}-${user.id.substring(0, 4)}`;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left 2 Columns: Appointments */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Hello, {user.name}</h1>
          <p className="text-sm text-zinc-500">Manage your active beauty salon appointments and history</p>
        </div>

        {/* Active bookings list */}
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">Upcoming Bookings</h3>
          {upcomingBookings.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 font-medium">
              No upcoming appointments. Need a fresh cut? <Link href="/search" className="text-amber-500 font-bold underline">Search Salons</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {upcomingBookings.map((b) => (
                <div key={b.id} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {b.status.toLowerCase()}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">#{b.id.substring(0, 8)}</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{b.service?.name}</h4>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mt-1 font-semibold">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {b.salon?.name}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setRescheduleBookingId(b.id)}
                      className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past bookings list */}
        <div className="flex flex-col gap-4">
          <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">Past Appointments</h3>
          {pastBookings.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-400 font-medium">No past appointments recorded.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {pastBookings.map((b) => (
                <div key={b.id} className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-250">{b.service?.name}</span>
                    <span className="text-zinc-400">{b.salon?.name} • {new Date(b.startTime).toLocaleDateString()}</span>
                  </div>
                  <span className={`capitalize text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-250 text-zinc-600'
                  }`}>
                    {b.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Loyalty, Referrals & Wallet */}
      <div className="flex flex-col gap-6">
        
        {/* Wallet & Points Details */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-3xl flex flex-col gap-4 shadow-sm">
          <h4 className="font-extrabold text-xs text-zinc-450 uppercase tracking-wider">My Balance</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 gap-1">
              <Wallet className="h-5 w-5 text-emerald-500" />
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {Number(user.profile?.walletBalance || 0).toFixed(0)} ETB
              </span>
              <span className="text-[10px] text-zinc-400">Teraz Wallet</span>
            </div>

            <div className="flex flex-col bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 gap-1">
              <Gift className="h-5 w-5 text-indigo-500" />
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {user.profile?.points || 0} pts
              </span>
              <span className="text-[10px] text-zinc-400">Loyalty Points</span>
            </div>
          </div>
        </div>

        {/* Loyalty Tier Status badge */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-3xl flex flex-col gap-3">
          <h4 className="font-extrabold text-xs text-zinc-450 uppercase tracking-wider flex items-center gap-1">
            <Award className="h-4.5 w-4.5 text-amber-500" /> Loyalty Tier status
          </h4>
          
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-150">Bronze Tier Member</span>
            <div className="w-full bg-zinc-100 dark:bg-zinc-850 h-2.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((user.profile?.points || 0) / 1000) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 font-semibold">
              {1000 - (user.profile?.points || 0) > 0 
                ? `${1000 - (user.profile?.points || 0)} more points to Silver (10% discounts on all bookings)`
                : 'Silver Tier achieved! Enjoy 10% cashbacks!'
              }
            </span>
          </div>
        </div>

        {/* Referral code share Panel */}
        <div className="bg-gradient-to-tr from-zinc-900 to-zinc-850 dark:from-zinc-950 dark:to-zinc-900 text-white p-6 rounded-3xl flex flex-col gap-4 shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Onboard Friends</span>
            <h4 className="font-extrabold text-md tracking-tight">Earn 100 ETB for each signup</h4>
          </div>

          <div className="bg-white/10 border border-white/10 p-3 rounded-2xl flex items-center justify-between mt-1">
            <code className="text-xs font-bold font-mono tracking-widest text-amber-400">{myReferralCode}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(myReferralCode);
                alert('Referral code copied to clipboard!');
              }}
              className="text-[10px] font-extrabold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-all"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* RESCHEDULE OVERLAY MODAL */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-150">Select New Time Slot</h4>
              <button onClick={() => setRescheduleBookingId(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">New Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">New Time Slot (HH:MM)</label>
                <select
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  required
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                >
                  <option value="">Select a Slot</option>
                  {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={rescheduling || !newDate || !newSlot}
                className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors"
              >
                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
