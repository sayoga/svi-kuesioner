'use client';

import Link from 'next/link';
import { ClipboardList, BarChart3, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeFormId?: string;
  isAdmin?: boolean;
}

export function Navbar({ activeFormId, isAdmin = false }: NavbarProps) {

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg"
        >
          <span className="inline-flex items-start font-bold text-[#DF1A3D] group-hover:text-red-500 transition-colors tracking-tight text-lg">
            SHARING VISION
            <span className="text-[0.6em] font-bold leading-none ml-[2px] pt-[0.1em]">™</span>
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            v1.0
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !isAdmin
                ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Form Survei</span>
          </Link>

          <Link
            href={activeFormId ? `/admin/dashboard?formId=${activeFormId}` : '/admin/dashboard'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isAdmin
                ? 'bg-gradient-to-r from-[#DF1A3D] to-[#E31E51] text-white shadow-md shadow-rose-950/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Admin</span>
            <span className="hidden md:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/20 text-white">
              <Sparkles className="w-2.5 h-2.5" />
              Live
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
