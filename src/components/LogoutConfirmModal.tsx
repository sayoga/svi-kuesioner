'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { LogOut, AlertTriangle, Loader2, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { logoutAdminAction } from '@/actions/auth';

interface LogoutConfirmModalProps {
  triggerClassName?: string;
}

export function LogoutConfirmModal({ triggerClassName }: LogoutConfirmModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut]);

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
      // 1. Clear Firebase client-side auth
      try {
        await signOut(auth);
      } catch {
        // Ignore client auth error
      }

      // 2. Call server action to clear cookies
      await logoutAdminAction();
    } catch {
      // Fallback redirect if server action didn't trigger navigation
      router.push('/admin/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Keluar dari Admin Portal"
        className={
          triggerClassName ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0'
        }
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Keluar</span>
      </button>

      {/* Confirmation Modal Rendered into document.body */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => !isLoggingOut && setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
                  onClick={() => setIsOpen(false)}
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
        )}
    </>
  );
}
