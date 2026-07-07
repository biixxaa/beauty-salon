// src/components/Footer.tsx
import Link from 'next/link';
import { Scissors, Heart, Shield, HelpCircle, FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 border-t border-zinc-200 dark:bg-black dark:border-zinc-900 transition-colors mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Scissors className="h-4 w-4 rotate-45" />
          </div>
          <span className="text-md font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Teraz<span className="text-amber-500">Beauty</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/privacy" className="flex items-center gap-1 hover:text-amber-500 transition-colors">
            <Shield className="h-3.5 w-3.5" />
            Privacy Policy
          </Link>
          <Link href="/terms" className="flex items-center gap-1 hover:text-amber-500 transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Terms of Service
          </Link>
          <Link href="/help" className="flex items-center gap-1 hover:text-amber-500 transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />
            Help Center
          </Link>
        </div>

        {/* copyright */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 flex items-center gap-1">
          &copy; {new Date().getFullYear()} TerazBeauty. Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> for Addis Ababa.
        </p>
      </div>
    </footer>
  );
}
