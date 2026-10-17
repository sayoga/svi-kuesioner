'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  FileEdit,
  FileSpreadsheet,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LogoutConfirmModal } from './LogoutConfirmModal';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    description: 'Metrik & diagram pilihan ganda',
  },
  {
    name: 'Tanggapan Responden',
    href: '/admin/responses',
    icon: MessageSquareText,
    description: 'Tabel jawaban teks & masukan',
  },
  {
    name: 'Kuesioner',
    href: '/admin/kuesioner',
    icon: FileEdit,
    description: 'Kelola & buat formulir survei',
  },
  {
    name: 'Tabel Report',
    href: '/admin/report',
    icon: FileSpreadsheet,
    description: 'Rekap seluruh data responden',
  },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({ mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFormId = searchParams.get('formId') || '';

  const buildHref = (baseHref: string) => {
    if (!currentFormId) return baseHref;
    return `${baseHref}?formId=${currentFormId}`;
  };

  const sidebarBody = (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="flex items-center group focus:outline-none"
        >
          <Image
            src="/Logo-Sharingvision-Main.png"
            alt="Sharing Vision Logo"
            width={140}
            height={28}
            className="h-7 w-auto object-contain transition-opacity group-hover:opacity-85"
            priority
          />
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-1.5">
        <div className="mb-2 px-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Menu Utama
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#DF1A3D] animate-pulse" />
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/admin/dashboard' && pathname.startsWith('/admin/dashboard'));

            return (
              <Link
                key={item.href}
                href={buildHref(item.href)}
                onClick={onCloseMobile}
                className={`group flex items-center gap-3 p-2.5 rounded-2xl text-xs transition-all relative ${
                  isActive
                    ? 'bg-rose-50 dark:bg-[#DF1A3D]/15 text-[#DF1A3D] dark:text-white font-bold border border-rose-200/80 dark:border-[#DF1A3D]/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[#DF1A3D] to-[#A30018] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/[0.1] group-hover:text-slate-800 dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block leading-snug">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate leading-tight">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shrink-0 space-y-2">
        <a
          href={currentFormId ? `/form/${currentFormId}` : '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-white/10 shadow-xs"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#DF1A3D]" />
            <span>Formulir Publik</span>
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-1.5 py-0.2 rounded">
            Live
          </span>
        </a>

        {/* Logout Trigger in Sidebar */}
        <LogoutConfirmModal triggerClassName="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-rose-200 dark:border-rose-900/30 cursor-pointer" />

        <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Firebase Firestore
          </span>
          <span className="inline-flex items-start font-mono text-[#DF1A3D] font-bold text-[10px]">
            SHARING VISION
            <span className="text-[0.6em] font-bold leading-none ml-[2px] pt-[0.1em]">™</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop & Slide-out Panel */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 sm:w-80 max-w-[85vw] h-full p-3 flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] shadow-2xl flex flex-col overflow-hidden">
              {sidebarBody}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Floating Pill Sidebar Panel */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-20 p-4">
        <div className="h-[calc(100vh-2rem)] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] shadow-sm flex flex-col overflow-hidden transition-colors duration-300">
          {sidebarBody}
        </div>
      </aside>
    </>
  );
}
