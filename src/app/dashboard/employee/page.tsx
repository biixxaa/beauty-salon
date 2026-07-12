// src/app/dashboard/employee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Sparkles, User, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user || userData.user.role !== 'EMPLOYEE') {
        router.push('/settings?mode=login');
        return;
      }
      setUser(userData.user);

      // Fetch bookings assigned to this employee
      const bookingsRes = await fetch('/api/bookings?role=EMPLOYEE');
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

  const handleUpdateStatus = async (id: string, status: 'COMPLETED' | 'NO_SHOW') => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert(`Booking status recorded as ${status.toLowerCase()}.`);
        fetchDashboardData();
      } else {
        alert('Failed to update booking status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-555 font-bold">Loading schedule board...</span>
      </div>
    );
  }

  const activeTasks = bookings.filter((b) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(b.status));
  const completedTasks = bookings.filter((b) => b.status === 'COMPLETED');

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Stylist Task Board</h1>
        <p className="text-sm text-zinc-550">Review your daily schedule, check client instructions, and record service milestones</p>
      </div>

      {/* Scheduler board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Scheduled Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">My Task Queue</h3>
          
          {activeTasks.length === 0 ? (
            <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 font-medium">
              No tasks scheduled. Enjoy your break!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activeTasks.map((b) => (
                <div key={b.id} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {b.status.toLowerCase()}
                      </span>
                      <span className="text-zinc-400">ID: #{b.id.substring(0, 8)}</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{b.service?.name}</h4>
                    <p className="text-xs text-zinc-500">
                      Client: <strong>{b.customer?.name}</strong> {b.notes && `• Note: "${b.notes}"`}
                    </p>

                    <div className="flex gap-4 text-[11px] text-zinc-400 font-semibold mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.service?.duration}m)</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-end gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                      className="px-3.5 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-black text-white dark:text-zinc-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" /> Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'NO_SHOW')}
                      className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-lg transition-all"
                    >
                      No Show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Profile & Stats Summary */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-3xl flex flex-col gap-4">
            <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-wider">Metrics Summary</h4>
            
            <div className="flex flex-col gap-2 text-xs text-zinc-500 font-medium">
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <span>Completed Jobs Today:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{completedTasks.length}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                <span>Pending Jobs today:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Working hours block:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-105">08:00 - 20:00</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
