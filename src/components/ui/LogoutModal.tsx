'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, AlertTriangle, Loader2, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logoutAdminAction } from '@/actions/auth';

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Unified enterprise confirmation modal for logging out of the admin portal.
 * Features Bento Box design with accent line, backdrop blur, keyboard navigation (Escape),
 * and synchronized Firebase + Next.js cookie session revocation.
 */
export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Pastikan proses sign out client di-await sampai tuntas
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Firebase sign out error:', err);
      }

      // 2. Call server action to clear cookies
      await logoutAdminAction();

      // 3. HARD REDIRECT: Memaksa browser membuang seluruh cache Next.js Client-side Router
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Hard redirect fallback jika terjadi error
      window.location.href = '/admin/login';
    }
  };

  if (!isOpen || !mounted) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={() => !isLoggingOut && onClose()}
    >
      {/* Modal Container - Bento Box Style */}
      <div
        className="relative z-50 w-full max-w-md bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#DF1A3D] to-transparent" />

        {/* Close icon button */}
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header & Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-6">
            <h3
              id="logout-dialog-title"
              className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              Konfirmasi Keluar
            </h3>
            <p
              id="logout-dialog-description"
              className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed"
            >
              Apakah Anda yakin ingin mengakhiri sesi admin? Anda harus login kembali untuk mengakses dashboard.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors focus:outline-none disabled:opacity-50 cursor-pointer text-center"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleConfirmLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] text-white shadow-md transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengakhiri Sesi...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
