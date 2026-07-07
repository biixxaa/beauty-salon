// src/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Sun, Moon, User, Sparkles, LogOut, Wallet, Gift, LayoutDashboard, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenConsultant?: () => void;
}

export default function Navbar({ onOpenConsultant }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load user status
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user', err);
    }
  };

  useEffect(() => {
    fetchUser();
    // Watch for login events
    window.addEventListener('auth-change', fetchUser);
    return () => window.removeEventListener('auth-change', fetchUser);
  }, []);

  // Theme check
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark' ||
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass shadow-sm transition-all duration-300">
      <div className="mx-auto flex max-w-7xl h-20 items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <Scissors className="h-5 w-5 rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Teraz<span className="text-amber-500">Beauty</span>
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <Link href="/search" className="hover:text-amber-500 transition-colors">
            Discover Salons
          </Link>
          <button
            onClick={onOpenConsultant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all font-semibold"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            AI Consultation
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Dark Mode */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User state */}
          {user ? (
            <div className="flex items-center gap-4">
              {/* Wallet Indicator */}
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold">
                <Wallet className="h-3.5 w-3.5" />
                <span>{Number(user.profile?.walletBalance || 0).toFixed(0)} ETB</span>
              </div>

              {/* Loyalty points */}
              <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold">
                <Gift className="h-3.5 w-3.5" />
                <span>{user.profile?.points || 0} pts</span>
              </div>

              {/* Dashboard Link */}
              <Link
                href={`/dashboard/${user.role.toLowerCase() === 'super_admin' ? 'admin' : user.role.toLowerCase()}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-sm font-bold"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/settings?mode=login"
                className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-amber-500 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/settings?mode=register"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                Join as Business
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top duration-200">
          <Link
            href="/search"
            className="text-sm font-bold text-zinc-800 dark:text-zinc-200 hover:text-amber-500"
            onClick={() => setMobileMenuOpen(false)}
          >
            Discover Salons
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenConsultant?.();
            }}
            className="flex items-center gap-1.5 w-max px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-sm font-bold"
          >
            <Sparkles className="h-4 w-4" />
            AI Consultation
          </button>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>{Number(user.profile?.walletBalance || 0).toFixed(0)} ETB</span>
                </div>
                <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold">
                  <Gift className="h-3.5 w-3.5" />
                  <span>{user.profile?.points || 0} pts</span>
                </div>
              </div>

              <Link
                href={`/dashboard/${user.role.toLowerCase() === 'super_admin' ? 'admin' : user.role.toLowerCase()}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 justify-center text-sm font-bold text-zinc-800 dark:text-zinc-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-950 text-red-500 text-sm font-bold hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/settings?mode=login"
                className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/settings?mode=register"
                className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold shadow-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join as Business
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
