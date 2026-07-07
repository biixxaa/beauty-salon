// src/components/ClientWrapper.tsx
'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AIConsultant from './AIConsultant';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onOpenConsultant={() => setIsConsultantOpen(true)} />
      <main className="flex flex-col flex-1">
        {children}
      </main>
      <Footer />
      <AIConsultant isOpen={isConsultantOpen} onClose={() => setIsConsultantOpen(false)} />
    </div>
  );
}
