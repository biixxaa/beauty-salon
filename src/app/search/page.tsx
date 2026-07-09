// src/app/search/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Navigation, Star, ShieldCheck, Compass, SlidersHorizontal, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import InteractiveMap from '@/components/InteractiveMap';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query Params States
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [radius, setRadius] = useState(searchParams.get('radius') || '10');

  // GPS States
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Search suggestions and history
  const suggestions = [
    'Luxury manicure',
    'Afro puff style',
    'Hot towel shave',
    'Gel polish',
    'Deep conditioning',
  ];
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  // Result States
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch results based on filters
  const fetchSalons = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (query) params.append('query', query);
      if (rating) params.append('rating', rating);
      if (radius) params.append('radius', radius);
      if (latitude && longitude) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
      }

      const res = await fetch(`/api/salons?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSalons(data);
      } else {
        setSalons([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalons();
  }, [category, rating, radius, latitude, longitude]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSalons();
  };

  // Request actual GPS coordinates with a fallback to Bole, Addis Ababa
  const triggerGps = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Using fallback coordinates.');
      setLatitude(9.0010);
      setLongitude(38.7830);
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(`Failed to get location: ${error.message}. Falling back to Bole, Addis Ababa.`);
        setLatitude(9.0010);
        setLongitude(38.7830);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const clearGps = () => {
    setLatitude(null);
    setLongitude(null);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      {/* Left Pane: Search Controls & List */}
      <div className="w-full md:w-[60%] px-6 py-8 overflow-y-auto flex flex-col gap-6">
        
        {/* Search header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">Discover Beauty Salons</h1>
          <p className="text-sm text-zinc-500">Compare pricing, verify distances, and check availability instantly</p>
        </div>

        {/* Search input Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl focus-within:border-amber-500">
              <Search className="h-4.5 w-4.5 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search salon name, services..."
                className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 placeholder-zinc-400 text-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              className="px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Find
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span className="font-bold uppercase tracking-wider">Suggestions:</span>
            {suggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  setActiveSuggestion(term);
                  fetchSalons();
                }}
                className={`px-3 py-1 rounded-full border transition-all ${
                  activeSuggestion === term ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </form>

        {/* GPS location trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Navigation className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10 animate-bounce" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-amber-500">GPS Location Filtering</span>
              <span className="text-[11px] text-zinc-500">
                {latitude ? `Mocked: Bole, Addis Ababa (${latitude.toFixed(4)}, ${longitude?.toFixed(4)})` : 'Find salons nearest to you.'}
              </span>
            </div>
          </div>
          {latitude ? (
            <button
              onClick={clearGps}
              className="text-xs font-extrabold text-red-500 hover:text-red-600 underline"
            >
              Reset Location
            </button>
          ) : (
            <button
              onClick={triggerGps}
              disabled={gpsLoading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              {gpsLoading ? 'Locating...' : 'Use My GPS'}
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 focus:outline-none"
              >
                <option value="ALL">All Salons</option>
                <option value="WOMEN">Women Only</option>
                <option value="MEN">Men Only</option>
                <option value="KIDS">Kids Only</option>
                <option value="UNISEX">Unisex</option>
              </select>
            </div>

            {/* Radius selection (only active if GPS coordinates are set) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Distance Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                disabled={!latitude}
                className="w-full text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 focus:outline-none disabled:opacity-40"
              >
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="20">Within 20 km</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Min Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 focus:outline-none"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
              </select>
            </div>

            {/* Reset Filters button */}
            <button
              onClick={() => {
                setQuery('');
                setCategory('ALL');
                setRating('');
                setRadius('10');
                clearGps();
              }}
              className="mt-auto py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-xs font-bold rounded-xl transition-all"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Results ({salons.length})
          </span>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 border border-zinc-200 dark:border-zinc-800 rounded-2xl shimmer" />
              ))}
            </div>
          ) : salons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl gap-2">
              <Compass className="h-10 w-10 text-zinc-350" />
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">No salons match your search</h3>
              <p className="text-xs text-zinc-400 max-w-xs">Try adjusting your filters, searching for a different area, or resetting location limits.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {salons.map((salon) => (
                <div
                  key={salon.id}
                  onClick={() => router.push(`/salons/${salon.slug}`)}
                  className="flex gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl cursor-pointer hover:shadow-md hover:border-amber-500/30 transition-all group"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src={salon.bannerUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200'}
                      alt={salon.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-150 group-hover:text-amber-500 transition-colors">
                            {salon.name}
                          </h3>
                          {salon.isVerified && <ShieldCheck className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{salon.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{salon.address}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2.5">
                      <span className="text-zinc-400 font-medium">
                        {salon.category.toLowerCase()} salon
                      </span>
                      {salon.distance !== undefined && (
                        <span className="text-emerald-500 dark:text-emerald-450 font-bold flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {salon.distance} km away
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Interactive Map */}
      <div className="w-full md:w-[40%] h-[400px] md:h-auto md:sticky md:top-20 md:self-start p-6">
        <InteractiveMap
          salons={salons}
          centerCoordinates={latitude && longitude ? { latitude, longitude } : undefined}
        />

        <div className="mt-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">Quick search tips</h4>
          <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li>• Use exact service names like "gel polish" or "hot towel shave" for faster matching.</li>
            <li>• Enable GPS to see nearby salons with distance badges.</li>
            <li>• Filter by rating for trusted and verified partners.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
