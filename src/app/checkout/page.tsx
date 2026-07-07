// src/app/checkout/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Calendar, Clock, ShoppingBag, CreditCard, QrCode, Smartphone, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states for CBE
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cbePin, setCbePin] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        if (Array.isArray(data)) {
          const match = data.find((b: any) => b.id === bookingId);
          setBooking(match);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
        <span className="text-sm text-zinc-550 font-bold">Retrieving booking invoice...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Invoice not found</h3>
        <p className="text-sm text-zinc-555 max-w-sm mt-1">We couldn't retrieve the details for this transaction.</p>
        <Link href="/" className="mt-6 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm">
          Go Home
        </Link>
      </div>
    );
  }

  const handleSimulatePayment = async () => {
    setPaying(true);
    try {
      // Update booking to CONFIRMED and PAID
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Clear query cache/trigger refresh
        window.dispatchEvent(new Event('auth-change'));
      } else {
        alert('Failed to update booking status.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during payment verification.');
    } finally {
      setPaying(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto animate-in fade-in duration-300">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Payment Verified!</h2>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Your appointment is scheduled and confirmed. You can manage dates or message the salon from your dashboard.
        </p>

        <div className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-2 mt-6 text-xs text-left">
          <div className="flex justify-between font-bold">
            <span className="text-zinc-400">Salon Name:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{booking.salon?.name}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-zinc-400">Professional:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{booking.employee?.name}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-zinc-400">Scheduled Time:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{new Date(booking.startTime).toLocaleString()}</span>
          </div>
        </div>

        <Link
          href="/dashboard/customer"
          className="w-full mt-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
        >
          View Bookings Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
      {/* Left 3 Columns: Invoice Summary & Gateway */}
      <div className="md:col-span-3 flex flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-amber-500" /> Complete Checkout
        </h1>

        {/* PAYMENT FLOW SIMULATOR */}
        {booking.paymentMethod === 'TELEBIRR' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
              Telebirr Gateway Activated
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-white rounded-2xl shadow-inner border border-zinc-200">
              <QrCode className="h-32 w-32 text-zinc-900" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Scan QR to pay with Telebirr app</h4>
              <p className="text-[11px] text-zinc-550 max-w-xs leading-relaxed">
                Or click the simulate button below to mimic a callback verification from Telebirr's merchant portal API.
              </p>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={paying}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              {paying ? 'Verifying payment...' : `Complete ${Number(booking.finalPrice).toFixed(0)} ETB payment`}
            </button>
          </div>
        )}

        {booking.paymentMethod === 'CBE_BIRR' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider w-max">
              CBE Birr Wallet
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">CBE Birr Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0912345678"
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-400 uppercase">Wallet PIN</label>
                <input
                  type="password"
                  value={cbePin}
                  onChange={(e) => setCbePin(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={paying || phoneNumber.length < 9 || cbePin.length < 4}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              {paying ? 'Sending OTP request...' : `Pay ${Number(booking.finalPrice).toFixed(0)} ETB`}
            </button>
          </div>
        )}

        {booking.paymentMethod === 'CASH' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-center gap-5 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm">
              <Smartphone className="h-6 w-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">Pay Cash at Salon</h4>
              <p className="text-xs text-zinc-550 max-w-xs leading-relaxed">
                Your booking requires confirmation from the Salon Owner. You will pay in person after your service is completed.
              </p>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={paying}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              Confirm Cash Reservation
            </button>
          </div>
        )}

        <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
          TerazBeauty secure checkout utilizes localized SSL protocols. By completing payment, you agree to our booking terms and customer cancellation policies.
        </p>
      </div>

      {/* Right 2 Columns: Invoice Sidebar */}
      <div className="md:col-span-2 flex flex-col gap-6">
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
          <h4 className="font-extrabold text-sm text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Invoice Summary</h4>
          
          <div className="flex flex-col gap-3 text-xs border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
            <div className="flex items-start gap-2.5">
              <ShoppingBag className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{booking.service?.name}</span>
                <span className="text-[10px] text-zinc-550">Salon: {booking.salon?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-650 dark:text-zinc-350">
                {new Date(booking.startTime).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-650 dark:text-zinc-350">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.service?.duration} mins)
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 text-xs">
            <div className="flex justify-between text-zinc-500 font-medium">
              <span>Price:</span>
              <span>{Number(booking.totalPrice).toFixed(0)} ETB</span>
            </div>
            {Number(booking.discountApplied) > 0 && (
              <div className="flex justify-between text-red-500 font-bold">
                <span>Discount:</span>
                <span>-{Number(booking.discountApplied).toFixed(0)} ETB</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm text-zinc-900 dark:text-zinc-50 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3 mt-1">
              <span>Total Cost:</span>
              <span>{Number(booking.finalPrice).toFixed(0)} ETB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
