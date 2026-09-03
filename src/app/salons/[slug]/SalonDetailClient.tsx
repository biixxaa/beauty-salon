// src/app/salons/[slug]/SalonDetailClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShieldCheck, MapPin, Phone, Mail, Clock, Sparkles, X, User, ShoppingBag, Percent, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function SalonDetailClient({ slug: propSlug }: { slug?: string }) {
  const params = useParams();
  const router = useRouter();
  const slug = propSlug || (params?.slug as string);

  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Scheduler Overlay State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR'>('CASH');
  const [couponCode, setCouponCode] = useState('');

  // Coupon verification
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Slot Generator States
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch salon details on load
  useEffect(() => {
    const fetchSalonDetail = async () => {
      try {
        const res = await fetch(`/api/salons/${slug}`);
        if (!res.ok) {
          throw new Error('Salon not found');
        }
        const data = await res.json();
        setSalon(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchSalonDetail();
  }, [slug]);

  // Generate conflict-free slots when date or employee changes
  useEffect(() => {
    if (!selectedDate || !selectedEmployee || !selectedService || !salon?.workingHours) return;

    const generateSlots = async () => {
      setSlotsLoading(true);
      setAvailableSlots([]);
      try {
        // 1. Get salon working hours for the selected day of the week
        const dateObj = new Date(selectedDate);
        const dayOfWeek = dateObj.getDay();
        const workHours = salon.workingHours.find((w: any) => w.dayOfWeek === dayOfWeek);

        if (!workHours || workHours.isClosed) {
          return; // Closed
        }

        // 2. Generate increments of 30 mins
        const slots: string[] = [];
        const [openHour, openMin] = workHours.openTime.split(':').map(Number);
        const [closeHour, closeMin] = workHours.closeTime.split(':').map(Number);

        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;
        const duration = selectedService.duration || 45;

        // Fetch bookings for this employee on this date to check overlaps
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch bookings
        const res = await fetch('/api/bookings?role=ADMIN');
        const allBookings = await res.json();
        const employeeBookings = Array.isArray(allBookings)
          ? allBookings.filter(
              (b: any) =>
                b.employeeId === selectedEmployee.id &&
                new Date(b.startTime) >= startOfDay &&
                new Date(b.startTime) <= endOfDay &&
                b.status !== 'CANCELLED'
            )
          : [];

        for (let time = openMinutes; time + duration <= closeMinutes; time += 30) {
          const hour = Math.floor(time / 60);
          const min = time % 60;
          const slotStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

          const slotStart = new Date(selectedDate);
          slotStart.setHours(hour, min, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

          const hasOverlap = employeeBookings.some((b: any) => {
            const bStart = new Date(b.startTime);
            const bEnd = new Date(b.endTime || bStart.getTime() + 60 * 60 * 1000);
            return slotStart < bEnd && slotEnd > bStart;
          });

          if (!hasOverlap) {
            slots.push(slotStr);
          }
        }
        setAvailableSlots(slots);
      } catch (err) {
        console.error(err);
      } finally {
        setSlotsLoading(false);
      }
    };

    generateSlots();
  }, [selectedDate, selectedEmployee, selectedService, salon]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-zinc-500 font-bold">Loading salon profiles...</span>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Failed to load salon</h3>
        <p className="text-sm text-zinc-500 max-w-sm mt-1">{error || 'The requested salon profile could not be found.'}</p>
        <button onClick={() => router.push('/search')} className="mt-6 px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-sm">
          Back to Discover
        </button>
      </div>
    );
  }

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    const coupon = salon.coupons?.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase());
    if (coupon) {
      setDiscountPercent(coupon.discountPercent);
      setCouponSuccess(`Success! ${coupon.discountPercent}% discount applied.`);
    } else {
      setDiscountPercent(0);
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedSlot) {
      alert('Please fill in all booking details.');
      return;
    }

    try {
      const [hour, min] = selectedSlot.split(':').map(Number);
      const bookingDateTime = new Date(selectedDate);
      bookingDateTime.setHours(hour, min, 0, 0);

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: salon.id,
          serviceId: selectedService.id,
          employeeId: selectedEmployee.id,
          startTimeStr: bookingDateTime.toISOString(),
          paymentMethod,
          couponCode: discountPercent > 0 ? couponCode : undefined,
          notes,
          totalPrice: finalPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit booking');
        return;
      }

      router.push(`/checkout?bookingId=${data.booking.id}`);
    } catch (err) {
      console.error(err);
      alert('An error occurred during booking.');
    }
  };

  const price = selectedService ? Number(selectedService.price) : 0;
  const discount = (price * discountPercent) / 100;
  const finalPrice = Math.max(0, price - discount);

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* 1. Salon Hero Header */}
      <section className="relative w-full h-[250px] md:h-[400px] bg-zinc-200 overflow-hidden">
        <Image
          src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200'}
          alt={salon.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 lg:px-8 pb-8 text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-500 text-white w-max uppercase tracking-wider">
              {salon.category.toLowerCase()} salon
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{salon.name}</h1>
              {salon.isVerified && <ShieldCheck className="h-6 w-6 text-amber-500 fill-amber-500/10 shrink-0" />}
            </div>
            <p className="text-sm text-zinc-300 flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 shrink-0 text-amber-400" />
              {salon.address}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-xl text-sm font-bold shadow-md">
                <Star className="h-4 w-4 fill-current" />
                <span>{Number(salon.rating).toFixed(1)}</span>
              </div>
              <span className="text-xs text-zinc-300 mt-1 font-semibold">{salon.reviews?.length || 0} reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Content Split */}
      <section className="mx-auto max-w-7xl w-full px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 flex flex-col gap-10">
          {/* About description */}
          <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/65 p-6 rounded-2xl">
            <h3 className="font-extrabold text-md text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" /> About
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
              {salon.description || 'Welcome to TerazBeauty luxury salons. Experienced styling technicians, clean environment, and outstanding customer service.'}
            </p>
          </div>

          {/* Services Catalog */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-500" /> Services Menu
            </h3>

            <div className="flex flex-col gap-3">
              {salon.services?.map((service: any) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl hover:border-amber-500/20 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col gap-1 pr-4">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{service.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{service.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.duration} mins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                      {Number(service.price).toFixed(0)} ETB
                    </span>
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        if (service.employees?.length > 0) {
                          setSelectedEmployee(service.employees[0].employee || service.employees[0]);
                        } else if (salon.employees?.length > 0) {
                          setSelectedEmployee(salon.employees[0]);
                        }
                        setBookingModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Showcase */}
          {salon.portfolio && salon.portfolio.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                Portfolio Showcase
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {salon.portfolio.map((item: any) => (
                  <div key={item.id} className="relative aspect-square bg-zinc-100 rounded-xl overflow-hidden shadow-sm group">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || 'Portfolio'}
                      fill
                      className="object-cover group-hover:scale-105 transition-all duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Customer Reviews ({salon.reviews?.length || 0})
            </h3>

            {salon.reviews?.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-400 font-medium">
                No reviews yet. Be the first to leave feedback after your appointment!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {salon.reviews?.map((rev: any) => (
                  <div key={rev.id} className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 shrink-0">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{rev.customer?.name}</span>
                          <span className="text-[10px] text-zinc-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Location Details, Hours */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-6 rounded-2xl flex flex-col gap-4">
            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Contacts & Location</h4>

            <div className="flex flex-col gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-zinc-400" />
                <span>{salon.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>{salon.email}</span>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
                <Clock className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-bold text-zinc-800 dark:text-zinc-300 mb-0.5">Working Hours:</span>
                  {salon.workingHours?.map((wh: any) => {
                    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return (
                      <div key={wh.id} className="flex justify-between font-medium">
                        <span className="text-zinc-400">{daysMap[wh.dayOfWeek]}</span>
                        <span>{wh.isClosed ? 'Closed' : `${wh.openTime} - ${wh.closeTime}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOOKING SCHEDULER OVERLAY MODAL */}
      {bookingModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
              <div>
                <h3 className="font-extrabold text-md text-zinc-900 dark:text-zinc-100">Schedule Service</h3>
                <span className="text-xs text-zinc-400">Book slot for {selectedService.name}</span>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleBookingSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {/* Professional Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Professional</label>
                <div className="grid grid-cols-2 gap-2">
                  {salon.employees?.map((emp: any) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setSelectedSlot('');
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                        selectedEmployee?.id === emp.id
                          ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="line-clamp-1">{emp.user?.name || emp.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                  }}
                  required
                  className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-amber-500 text-zinc-850 dark:text-zinc-150"
                />
              </div>

              {/* Slot Generator Grid */}
              {selectedDate && selectedEmployee && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Available Slots</label>
                  {slotsLoading ? (
                    <span className="text-xs text-zinc-400 animate-pulse font-medium">Checking availability...</span>
                  ) : availableSlots.length === 0 ? (
                    <span className="text-xs text-red-500 font-bold">Closed or no slots available on this date.</span>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                            selectedSlot === slot
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Special Requests (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us if you have any hair length, style specifications or skin irritations..."
                  rows={2}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-amber-500 text-zinc-850 dark:text-zinc-150"
                />
              </div>

              {/* Coupon Code Entry */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. BEAUTY20"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:border-amber-500 text-zinc-850 dark:text-zinc-150 uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-black text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <span className="text-[11px] text-red-500 font-bold">{couponError}</span>}
                {couponSuccess && <span className="text-[11px] text-emerald-500 font-bold">{couponSuccess}</span>}
              </div>

              {/* Payment selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment Option</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'TELEBIRR', 'CBE_BIRR'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <span className="font-extrabold capitalize">{method.toLowerCase().replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Details summary */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl flex flex-col gap-2 mt-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Service Fee:</span>
                  <span>{price} ETB</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Coupon Discount:
                    </span>
                    <span>-{discount} ETB</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-zinc-900 dark:text-zinc-50 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2">
                  <span>Estimated Total:</span>
                  <span>{finalPrice} ETB</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!selectedSlot}
                className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 text-white font-bold rounded-2xl text-center shadow-lg transition-all cursor-pointer"
              >
                Confirm Appointment Slot
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
