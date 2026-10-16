'use client';

import { useState } from 'react';
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
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <AdminHeader
          forms={forms}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
