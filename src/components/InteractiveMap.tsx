// src/components/InteractiveMap.tsx
'use client';

import { useState } from 'react';
import { MapPin, Navigation, Star, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface SalonPin {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  xPercent: number; // For plotting on our SVG grid
  yPercent: number;
}

interface InteractiveMapProps {
  salons: any[];
  onSelectSalon?: (salon: any) => void;
  centerCoordinates?: { latitude: number; longitude: number };
}

export default function InteractiveMap({ salons, onSelectSalon, centerCoordinates }: InteractiveMapProps) {
  const [activeSalon, setActiveSalon] = useState<any>(null);

  // Map coordinate range roughly corresponding to Addis Ababa
  // Lat: 8.98 to 9.04, Lng: 38.74 to 38.80
  const convertCoordsToPercent = (lat: number, lng: number) => {
    const latMin = 8.995;
    const latMax = 9.035;
    const lngMin = 38.745;
    const lngMax = 38.795;

    // Calculate percent positions
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    // Invert Y because SVG coordinates start from top
    const y = 100 - ((lat - latMin) / (latMax - latMin)) * 100;

    return {
      x: Math.min(Math.max(x, 5), 95),
      y: Math.min(Math.max(y, 5), 95),
    };
  };

  const getPinColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'MEN': return 'bg-blue-500 border-blue-200';
      case 'WOMEN': return 'bg-rose-500 border-rose-200';
      case 'KIDS': return 'bg-amber-500 border-amber-200';
      default: return 'bg-emerald-500 border-emerald-200';
    }
  };

  return (
    <div className="relative w-full h-[400px] md:h-full min-h-[350px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-end">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#c5a880_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

      {/* Styled Simulated Major Roads in Addis Ababa */}
      <svg className="absolute inset-0 w-full h-full text-zinc-300 dark:text-zinc-800 opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {/* Bole Road */}
        <line x1="20%" y1="90%" x2="80%" y2="20%" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <text x="35%" y="60%" className="fill-zinc-400 dark:fill-zinc-600 text-[10px] font-sans rotate-[-45deg] font-bold">Bole Road</text>
        
        {/* Churchill Road */}
        <line x1="40%" y1="10%" x2="40%" y2="90%" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <text x="43%" y="30%" className="fill-zinc-400 dark:fill-zinc-600 text-[10px] font-sans rotate-90 font-bold">Churchill Avenue</text>
        
        {/* Ring Road */}
        <path d="M 10 30 Q 50 120 90 30" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="5,5" />
        <text x="50%" y="78%" className="fill-zinc-400 dark:fill-zinc-600 text-[9px] font-sans font-bold">Ring Road</text>
      </svg>

      {/* Location Badge */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-md">
        <Navigation className="h-4 w-4 text-amber-500 fill-amber-500/20" />
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Addis Ababa Map View</span>
      </div>

      {/* Current location mock pin */}
      {centerCoordinates && (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            left: `${convertCoordsToPercent(centerCoordinates.latitude, centerCoordinates.longitude).x}%`,
            top: `${convertCoordsToPercent(centerCoordinates.latitude, centerCoordinates.longitude).y}%`,
          }}
        >
          <div className="absolute h-8 w-8 rounded-full bg-amber-500/30 animate-ping" />
          <div className="h-4 w-4 rounded-full bg-amber-500 border-2 border-white dark:border-zinc-950 shadow-md" />
        </div>
      )}

      {/* Salon Pins */}
      {salons.map((salon) => {
        const { x, y } = convertCoordsToPercent(salon.latitude, salon.longitude);
        const isActive = activeSalon?.id === salon.id;

        return (
          <div
            key={salon.id}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {/* Clickable Pin Pinpoint */}
            <button
              onClick={() => {
                setActiveSalon(isActive ? null : salon);
                if (onSelectSalon) onSelectSalon(salon);
              }}
              className={`flex items-center justify-center h-8 w-8 rounded-full text-white border-2 shadow-lg transition-transform duration-300 hover:scale-110 ${getPinColor(salon.category)}`}
            >
              <MapPin className="h-4.5 w-4.5 fill-white/10" />
            </button>
          </div>
        );
      })}

      {/* Floating details overlay card */}
      {activeSalon && (
        <div className="absolute bottom-4 left-4 right-4 z-30 mx-auto max-w-sm glass border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">{activeSalon.name}</h4>
                {activeSalon.isVerified && <ShieldCheck className="h-4 w-4 text-amber-500 fill-amber-500/10" />}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{activeSalon.address}</p>
            </div>
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
              <Star className="h-3 w-3 fill-current" />
              <span>{activeSalon.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2.5">
            <span className="text-zinc-400 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {activeSalon.phone}
            </span>
            <Link
              href={`/salons/${activeSalon.slug}`}
              className="text-amber-500 hover:text-amber-600 font-bold hover:underline"
            >
              Book Service &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
