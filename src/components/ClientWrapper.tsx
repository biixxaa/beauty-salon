// src/components/ClientWrapper.tsx
'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AIConsultant from './AIConsultant';
import { installMockApi, switchDemoRole, getCurrentUser } from '@/lib/mockApi';
import { Sparkles, User, Shield, Briefcase, Scissors, ChevronUp, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [demoBarOpen, setDemoBarOpen] = useState(false);

  useEffect(() => {
    installMockApi();
    const update = () => setCurrentUser(getCurrentUser());
    update();
    window.addEventListener('auth-change', update);
    return () => window.removeEventListener('auth-change', update);
  }, []);

  const handleRoleChange = (roleKey: 'customer' | 'salon_owner' | 'employee' | 'admin', dashboardPath: string) => {
    switchDemoRole(roleKey);
    setCurrentUser(getCurrentUser());
    router.push(dashboardPath);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenConsultant={() => setIsConsultantOpen(true)} />
      <main className="flex flex-col flex-1">
        {children}
      </main>
      <Footer />
      <AIConsultant isOpen={isConsultantOpen} onClose={() => setIsConsultantOpen(false)} />

      {/* Floating Demo Role Switcher */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="bg-zinc-900/95 backdrop-blur-md text-white border border-zinc-700/80 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 max-w-sm transition-all duration-200">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Demo Role:</span>
              <span className="text-amber-400 font-extrabold uppercase">
                {currentUser?.role || 'Guest'}
              </span>
            </div>
            <button
              onClick={() => setDemoBarOpen(!demoBarOpen)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title={demoBarOpen ? 'Collapse demo switcher' : 'Expand demo switcher'}
            >
              {demoBarOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>

          {demoBarOpen && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-800 text-xs">
              <span className="text-[11px] text-zinc-400">Switch user & view dashboards:</span>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <button
                  onClick={() => handleRoleChange('customer', '/dashboard/customer')}
                  className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentUser?.role === 'CUSTOMER'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> Customer
                </button>
                <button
                  onClick={() => handleRoleChange('salon_owner', '/dashboard/salon')}
                  className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentUser?.role === 'SALON_OWNER'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Scissors className="h-3.5 w-3.5" /> Salon Owner
                </button>
                <button
                  onClick={() => handleRoleChange('employee', '/dashboard/employee')}
                  className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentUser?.role === 'EMPLOYEE'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" /> Stylist
                </button>
                <button
                  onClick={() => handleRoleChange('admin', '/dashboard/admin')}
                  className={`p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    currentUser?.role === 'ADMIN'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" /> Admin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
