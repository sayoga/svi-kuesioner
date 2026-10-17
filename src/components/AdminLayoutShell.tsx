'use client';

import { useState, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import type { FormRecord } from '@/types/form';

interface AdminLayoutShellProps {
  forms: FormRecord[];
  children: React.ReactNode;
}

export function AdminLayoutShell({ forms, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on admin login page, render children standalone without sidebar/header
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative selection:bg-red-600 selection:text-white antialiased transition-colors duration-300">
      {/* Admin Floating Sidebar */}
      <Suspense fallback={<aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-20 p-4" />}>
        <AdminSidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <Suspense fallback={<header className="sticky top-0 z-30 w-full h-16 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212]" />}>
          <AdminHeader
            forms={forms}
            onOpenMobileSidebar={() => setMobileOpen(true)}
          />
        </Suspense>

        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
