// src/app/page.tsx
'use client';

import { useState, useEffect, type SVGProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Sparkles, Star, Scissors, Heart, Flame, ShieldCheck, Compass, ArrowRight, UserPlus, Gift } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [featuredSalons, setFeaturedSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured salons on load
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/salons?featured=true');
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeaturedSalons(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?query=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`);
  };

  const categories = [
    { name: 'All Services', code: 'ALL', icon: Compass },
    { name: 'Women\'s Salons', code: 'WOMEN', icon: Heart },
    { name: 'Men\'s Barbers', code: 'MEN', icon: Scissors },
    { name: 'Kids\' Salons', code: 'KIDS', icon: SmileIcon },
    { name: 'Unisex Centers', code: 'UNISEX', icon: Sparkles },
  ];

  function SmileIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" />
        <line x1="15" x2="15.01" y1="9" y2="9" />
      </svg>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6 lg:px-8 text-center bg-gradient-to-b from-amber-500/5 via-transparent to-transparent">
        {/* Decorative blur balls */}
        <div className="absolute top-1/4 left-1/10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-1/10 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="mx-auto max-w-4xl flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5" /> First-Class Beauty Booking in Ethiopia
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-3xl leading-[1.15]">
            Discover nearby salons, compare prices, book instantly.
          </h1>
          
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl">
            Book professional hair, nails, shave, spa, and beauty treatments across Addis Ababa. Fast, transparent, and secure.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl md:rounded-full shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-4"
          >
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What service or salon are you looking for?"
                className="w-full bg-transparent border-0 focus:ring-0 text-sm focus:outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
              />
            </div>

            {/* Category Selector */}
            <div className="md:border-l border-zinc-200 dark:border-zinc-850 px-4 py-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-zinc-600 dark:text-zinc-400 focus:outline-none cursor-pointer pr-4"
              >
                <option value="ALL">All Categories</option>
                <option value="WOMEN">Women's Salons</option>
                <option value="MEN">Men's Barbers</option>
                <option value="KIDS">Kids' Salons</option>
                <option value="UNISEX">Unisex Centers</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl md:rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 2. Category Quick Filters */}
      <section className="px-6 lg:px-8 mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.code}
                href={`/search?category=${cat.code}`}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl hover:border-amber-500/50 hover:shadow-md transition-all text-center group"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-500/5 group-hover:bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3.5 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 transition-colors">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Salons */}
      <section className="px-6 lg:px-8 mx-auto max-w-7xl w-full mt-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">Featured Salons</h2>
            <p className="text-sm text-zinc-400 dark:text-zinc-650">Highly rated luxury salons in Addis Ababa</p>
          </div>
          <Link href="/search" className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1">
            See all salons <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSalons.map((salon) => (
              <Link
                key={salon.id}
                href={`/salons/${salon.slug}`}
                className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all"
              >
                {/* Banner */}
                <div className="relative w-full h-48 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <Image
                    src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=300'}
                    alt={salon.name}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{salon.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-md text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors line-clamp-1">
                      {salon.name}
                    </h3>
                    {salon.isVerified && <ShieldCheck className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10 shrink-0" />}
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-450 line-clamp-1">{salon.address}</p>

                  <div className="flex items-center gap-2 mt-1 border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 capitalize">
                      {salon.category.toLowerCase()}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {salon.services?.length || 0} services available
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. Referral / Loyalty Banner */}
      <section className="px-6 lg:px-8 mx-auto max-w-7xl w-full mt-24">
        <div className="relative overflow-hidden bg-gradient-to-tr from-zinc-900 to-zinc-850 dark:from-zinc-950 dark:to-zinc-900 text-white rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col gap-4 max-w-xl">
            <span className="text-xs font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <Gift className="h-4 w-4" /> Teraz Referral Rewards
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              Share TerazBeauty, earn cash & points on every invite!
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Invite your friends to book their styling treatments! They will receive a <strong className="text-white">50 ETB welcome bonus</strong>, and you'll get <strong className="text-white">100 ETB cashback</strong> credited straight to your wallet.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/settings?mode=register"
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
            >
              <UserPlus className="h-4.5 w-4.5" /> Sign Up & Start Earning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
