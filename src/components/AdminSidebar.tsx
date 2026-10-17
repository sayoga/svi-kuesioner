'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  FileEdit,
  FileSpreadsheet,
  Users,
  ScrollText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  ArrowLeft,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  description: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main',
    title: 'MENU UTAMA',
    items: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Metrik & diagram pilihan ganda',
      },
      {
        name: 'Kuesioner',
        href: '/admin/kuesioner',
        icon: FileEdit,
        description: 'Kelola & buat formulir survei',
      },
      {
        name: 'Tanggapan Responden',
        href: '/admin/responses',
        icon: MessageSquareText,
        description: 'Tabel jawaban teks & masukan',
      },
      {
        name: 'Tabel Report',
        href: '/admin/report',
        icon: FileSpreadsheet,
        description: 'Rekap seluruh data responden',
      },
    ],
  },
  {
    id: 'admin',
    title: 'ADMINISTRATOR',
    items: [
      {
        name: 'Manajemen User',
        href: '/admin/users',
        icon: Users,
        description: 'Kelola akun admin & kredensial',
      },
      {
        name: 'Audit Trail',
        href: '/admin/audit-logs',
        icon: ScrollText,
        description: 'Catatan aktivitas & log keamanan',
      },
    ],
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

  // Desktop sidebar expand / collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Accordion open/collapse state per group (when sidebar is expanded)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Automatically keep a group expanded if the user is currently on one of its routes
  useEffect(() => {
    NAV_GROUPS.forEach((group) => {
      const hasActiveChild = group.items.some(
        (item) =>
          pathname === item.href ||
          (item.href !== '/admin' && pathname.startsWith(item.href))
      );
      if (hasActiveChild) {
        setCollapsedGroups((prev) => ({ ...prev, [group.id]: false }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const buildHref = (baseHref: string) => {
    if (!currentFormId) return baseHref;
    return `${baseHref}?formId=${currentFormId}`;
  };

  const renderSidebarBody = (collapsed: boolean) => {
    if (collapsed) {
      return (
        <div className="flex flex-col h-full bg-white dark:bg-[#121212] text-slate-800 dark:text-slate-100 transition-colors duration-300">
          {/* Collapsed Brand Header with Click-to-Expand Toggle */}
          <div className="h-16 border-b border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 px-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="relative p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer group transition-all focus:outline-none"
              title="Perluas Sidebar (Klik untuk membuka)"
              aria-label="Perluas Sidebar"
            >
              <Image
                src="/icon.png"
                alt="Sharing Vision Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover transition-transform group-hover:scale-105 shadow-xs"
                priority
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/20 flex items-center justify-center text-slate-500 group-hover:text-[#DF1A3D] transition-colors shadow-xs">
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </button>
          </div>

          {/* Collapsed Navigation Icons */}
          <div className="px-2 py-4 flex-1 overflow-y-auto space-y-2">
            {NAV_GROUPS.map((group, groupIdx) => (
              <div key={group.id} className="space-y-1">
                {groupIdx > 0 && (
                  <div className="h-px bg-slate-100 dark:bg-white/10 my-2 mx-1" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/admin/dashboard' &&
                        pathname.startsWith('/admin/dashboard')) ||
                      (item.href !== '/admin/dashboard' &&
                        pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={buildHref(item.href)}
                        title={`${item.name} — ${item.description}`}
                        className={`group flex items-center justify-center w-10 h-10 mx-auto rounded-2xl transition-all relative ${
                          isActive
                            ? 'bg-gradient-to-br from-[#DF1A3D] to-[#A30018] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {isActive && (
                          <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#DF1A3D] ring-2 ring-white dark:ring-[#121212]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Collapsed Footer Actions */}
          <div className="p-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] shrink-0 flex flex-col items-center gap-2">
            <a
              href={currentFormId ? `/form/${currentFormId}` : '/'}
              target="_blank"
              rel="noopener noreferrer"
              title="Formulir Publik (Live)"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-white/10 shadow-xs relative group cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#DF1A3D]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121212]" />
            </a>

            <Link
              href="/"
              title="Kembali ke Beranda"
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer group"
            >
              <Home className="w-4 h-4 text-[#DF1A3D] group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        </div>
      );
    }

    // Expanded Sidebar Body
    return (
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

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
              title="Ciutkan Sidebar (Collapse)"
              aria-label="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu with Grouped Accordions */}
        <div className="px-3 py-4 flex-1 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => {
            const isGroupCollapsed = Boolean(collapsedGroups[group.id]);
            const hasActiveItem = group.items.some(
              (item) =>
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href))
            );

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header with Accordion Toggle */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-left group cursor-pointer rounded-xl hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
                  aria-expanded={!isGroupCollapsed}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {group.title}
                    </span>
                    {hasActiveItem && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#DF1A3D] animate-pulse" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.2 rounded-md font-medium">
                      {group.items.length}
                    </span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                    )}
                  </div>
                </button>

                {/* Group Sub-items */}
                {!isGroupCollapsed && (
                  <nav className="space-y-1 pl-0.5 animate-in fade-in-50 duration-150">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href === '/admin/dashboard' &&
                          pathname.startsWith('/admin/dashboard')) ||
                        (item.href !== '/admin/dashboard' &&
                          pathname.startsWith(item.href));

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
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
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

          {/* Kembali ke Beranda Link */}
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-[#DF1A3D] group-hover:scale-110 transition-transform" />
              <span>Kembali ke Beranda</span>
            </span>
            <ArrowLeft className="w-3 h-3 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          </Link>

          <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Firebase Firestore
            </span>
            <div className="flex items-center shrink-0" title="Sharing Vision">
              <Image
                src="/Logo-Sharingvision-Main.png"
                alt="Sharing Vision Logo"
                width={100}
                height={20}
                className="h-4 w-auto object-contain opacity-85 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop & Slide-out Panel (Always Expanded) */}
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
              {renderSidebarBody(false)}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Floating Pill Sidebar Panel */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20 p-2' : 'w-64 lg:w-72 p-4'
        }`}
      >
        <div className="h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] shadow-sm flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          {renderSidebarBody(isCollapsed)}
        </div>
      </aside>
    </>
  );
}
