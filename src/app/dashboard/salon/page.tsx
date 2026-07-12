// src/app/dashboard/salon/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Sparkles, DollarSign, Users, Award, Percent, RefreshCw, Check, X, ShieldAlert } from 'lucide-react';

export default function SalonOwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [usageLimit, setUsageLimit] = useState('50');
  const [maxDiscount, setMaxDiscount] = useState('300');
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user || userData.user.role !== 'SALON_OWNER') {
        router.push('/settings?mode=login');
        return;
      }
      setUser(userData.user);

      // Fetch bookings as Salon Owner
      const bookingsRes = await fetch('/api/bookings?role=SALON_OWNER');
      const bookingsData = await bookingsRes.json();
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData);
      }

      const couponsRes = await fetch('/api/dashboard/coupons');
      const couponsData = await couponsRes.json();
      if (Array.isArray(couponsData)) {
        setCoupons(couponsData);
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

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert(`Booking updated to ${status.toLowerCase()}.`);
        fetchDashboardData();
      } else {
        alert('Failed to update booking status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || !discountPercent || !expiryDate) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponMessage('');

    try {
      const salonsRes = await fetch('/api/salons');
      const salons = await salonsRes.json();
      const mySalon = salons.find((s: any) => s.ownerId === user.id);

      if (!mySalon) {
        setCouponError('No registered salon found under your account. Please register your salon first.');
        return;
      }

      const res = await fetch('/api/dashboard/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: mySalon.id,
          code: couponCode,
          discountPercent: Number(discountPercent),
          maxDiscount: Number(maxDiscount),
          expiryDate,
          usageLimit: Number(usageLimit),
        }),
      });

      if (!res.ok) {
        const payload = await res.json();
        setCouponError(payload?.error || 'Unable to create coupon campaign.');
        return;
      }

      const data = await res.json();
      setCouponMessage(`Coupon ${data.coupon.code} created successfully.`);
      setCouponCode('');
      setDiscountPercent('10');
      setUsageLimit('50');
      setMaxDiscount('300');
      setExpiryDate(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().slice(0, 10);
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setCouponError('Failed to create coupon campaign.');
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-550 font-bold">Loading salon management deck...</span>
      </div>
    );
  }

  // Calculate stats
  const pendingRequests = bookings.filter((b) => b.status === 'PENDING');
  const activeReservations = bookings.filter((b) => ['CONFIRMED', 'RESCHEDULED'].includes(b.status));
  
  const totalRevenue = bookings
    .filter((b) => b.status === 'COMPLETED' || b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + Number(b.finalPrice), 0);

  const totalBookingsCount = bookings.length;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Salon Management Dashboard</h1>
        <p className="text-sm text-zinc-550">Review stylist occupancy, process appointments, and coordinate campaigns</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Total Revenue</span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{totalRevenue.toFixed(0)} ETB</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Total Bookings</span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{totalBookingsCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Queue Size</span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{pendingRequests.length} pending</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-5 rounded-2xl flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-450 uppercase font-bold tracking-wider">Active Campaigns</span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">4 active</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Scheduled Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Bookings Queue */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Pending Approval Queue */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Pending Approvals ({pendingRequests.length})
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 font-medium">
                No appointment requests pending validation.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingRequests.map((b) => (
                  <div key={b.id} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-amber-600 font-bold uppercase">Awaiting Action</span>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{b.service?.name}</h4>
                      <p className="text-xs text-zinc-550 dark:text-zinc-400">
                        Client: <strong className="text-zinc-800 dark:text-zinc-205">{b.customer?.name}</strong> • Staff: {b.employee?.name}
                      </p>
                      <div className="flex gap-4 text-xs text-zinc-400 font-semibold mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-end gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                        className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed / Active Appointments */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-extrabold text-zinc-900 dark:text-zinc-150 uppercase tracking-wider">Confirmed Appointments</h3>
            {activeReservations.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-medium">No active appointments scheduled.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeReservations.map((b) => (
                  <div key={b.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-150">{b.service?.name}</span>
                        <span className="text-[10px] text-zinc-400">#{b.id.substring(0, 8)}</span>
                      </div>
                      <span className="text-zinc-500">Client: {b.customer?.name} • Staff: {b.employee?.name}</span>
                      <span className="text-zinc-400 font-medium">{new Date(b.startTime).toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-black text-white dark:text-zinc-900 text-[10px] font-bold rounded-lg transition-colors shrink-0 self-end sm:self-center"
                    >
                      Mark Complete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Create Coupon Campaign Form */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-3xl flex flex-col gap-4">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wide flex items-center gap-1">
              <Percent className="h-4.5 w-4.5 text-amber-500" /> Create Coupon Promo
            </h4>

            <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Promo Code</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. SABA15"
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none uppercase"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Discount Percent (%)</label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Usage Limit</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Max Discount</label>
                  <input
                    type="number"
                    min={50}
                    required
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {couponMessage && <p className="text-sm text-emerald-600 font-semibold">{couponMessage}</p>}
              {couponError && <p className="text-sm text-red-500 font-semibold">{couponError}</p>}

              <button
                type="submit"
                disabled={couponLoading || !couponCode}
                className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                {couponLoading ? 'Creating Campaign...' : 'Launch Coupon Code'}
              </button>
            </form>

            {coupons.length > 0 && (
              <div className="mt-6 space-y-3">
                <h5 className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Active Coupons</h5>
                <div className="space-y-2">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="p-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="font-bold uppercase">{coupon.code}</span>
                        <span className="text-emerald-600">{coupon.discountPercent}%</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">Expires {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                      <p className="text-[11px] text-zinc-500">Used {coupon.timesRedeemed ?? 0}/{coupon.usageLimit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
