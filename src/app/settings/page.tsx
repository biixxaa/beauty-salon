// src/app/settings/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Scissors, User, Mail, Lock, Phone, HelpCircle, Gift, RefreshCw, Eye, EyeOff } from 'lucide-react';

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get('mode') || 'login';

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode as 'login' | 'register');
  const role = 'CUSTOMER';

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [referredByCode, setReferredByCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Error/Success state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Avoid synchronous setState in effect by deferring update
    if (defaultMode === 'login' || defaultMode === 'register') {
      const id = setTimeout(() => setMode(defaultMode as 'login' | 'register'), 0);
      return () => clearTimeout(id);
    }
  }, [defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to sign in');
        }

        setSuccess('Logged in successfully!');
        window.dispatchEvent(new Event('auth-change'));
        
        // Redirect based on role
        const targetRole = data.user.role.toLowerCase();
        if (targetRole === 'super_admin') {
          router.push('/dashboard/admin');
        } else if (targetRole === 'salon_owner') {
          router.push('/dashboard/salon');
        } else {
          router.push(`/dashboard/${targetRole}`);
        }
      } else {
        // Register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name,
            phone,
            role: role, // Allow both CUSTOMER and SALON_OWNER
            referralCodeUsed: referredByCode || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register account');
        }

        setSuccess('Registration complete! Directing you to your account...');
        // Automaticaly log in
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        window.dispatchEvent(new Event('auth-change'));
        
        const targetRole = loginData.user.role.toLowerCase();
        if (targetRole === 'super_admin') {
          router.push('/dashboard/admin');
        } else if (targetRole === 'salon_owner') {
          router.push('/dashboard/salon');
        } else {
          router.push(`/dashboard/${targetRole}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-6 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xl flex flex-col gap-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
            <Scissors className="h-6 w-6 rotate-45" />
          </div>
          <h2 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight mt-1">
            TerazBeauty Hub
          </h2>
          <p className="text-xs text-zinc-500">
            {mode === 'login' ? 'Sign in to access your bookings' : 'Create an account to book and earn points'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-55 dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
          <button
            onClick={() => {
              setMode('login');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-zinc-900 text-amber-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-zinc-900 text-amber-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {error && (
            <div className="p-3 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold">
              {success}
            </div>
          )}

          {/* Full Name (only on register) */}
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
                <User className="h-4 w-4 text-zinc-450 shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dawit Kebede"
                  className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-zinc-850 dark:text-zinc-150"
                />
              </div>
            </div>
          )}

          {/* Phone (only on register) */}
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
                <Phone className="h-4 w-4 text-zinc-450 shrink-0" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0912345678"
                  className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-zinc-850 dark:text-zinc-150"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Email Address</label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
              <Mail className="h-4 w-4 text-zinc-450 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-zinc-850 dark:text-zinc-150"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">Password</label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
              <Lock className="h-4 w-4 text-zinc-450 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-zinc-850 dark:text-zinc-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-450 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>



          {/* Referral Code (only on register) */}
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Referral Code (Optional)</label>
                <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <Gift className="h-3 w-3" /> Get 50 ETB bonus
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55 dark:bg-zinc-950">
                <Gift className="h-4 w-4 text-zinc-450 shrink-0" />
                <input
                  type="text"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value)}
                  placeholder="e.g. SABA-REFR"
                  className="w-full bg-transparent border-none text-xs focus:outline-none focus:ring-0 text-zinc-850 dark:text-zinc-150 uppercase"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-350 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}
