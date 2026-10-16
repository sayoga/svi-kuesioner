'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Menu,
  ClipboardList,
  ExternalLink,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Loader2,
  Sparkles,
  SearchX,
} from 'lucide-react';
import type { FormRecord } from '@/types/form';
import { LogoutConfirmModal } from '@/components/LogoutConfirmModal';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminHeaderProps {
  forms: FormRecord[];
  onOpenMobileSidebar?: () => void;
}

interface ToastState {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export function AdminHeader({ forms, onOpenMobileSidebar }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFormId = searchParams.get('formId') || '';

  // Combobox state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Status toggle state
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>({});
  const [isToggling, setIsToggling] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  // Helper to get active status with local optimistic overrides
  const getFormIsActive = (form: FormRecord) => {
    return statusOverrides[form.id] !== undefined
      ? statusOverrides[form.id]
      : form.is_active;
  };

  const selectedForm = forms.find((f) => f.id === currentFormId);
  const isCurrentFormActive = selectedForm ? getFormIsActive(selectedForm) : false;

  // Filter forms based on search query
  const filteredForms = forms.filter((form) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = form.title.toLowerCase().includes(query);
    const descMatch = form.description
      ? form.description.toLowerCase().includes(query)
      : false;
    return titleMatch || descMatch;
  });

  // Handle outside click to close combobox
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Handle changing form selection
  const handleSelectForm = (formId: string) => {
    setIsOpen(false);
    setSearchQuery('');

    const params = new URLSearchParams(searchParams.toString());
    if (formId) {
      params.set('formId', formId);
    } else {
      params.delete('formId');
    }

    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    router.push(targetUrl);
  };

  // Handle status toggle switch
  const handleToggleStatus = async () => {
    if (!selectedForm || isToggling) return;

    const currentStatus = isCurrentFormActive;
    const nextStatus = !currentStatus;

    // Optimistic update
    setStatusOverrides((prev) => ({
      ...prev,
      [selectedForm.id]: nextStatus,
    }));
    setIsToggling(true);

    try {
      const response = await fetch(`/api/forms/${selectedForm.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: nextStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memperbarui status kuesioner');
      }

      setToast({
        id: Date.now(),
        type: 'success',
        message: `Status kuesioner berhasil diubah menjadi ${
          nextStatus ? 'Aktif' : 'Nonaktif'
        }.`,
      });

      router.refresh();
    } catch (err: unknown) {
      // Revert optimistic update
      setStatusOverrides((prev) => ({
        ...prev,
        [selectedForm.id]: currentStatus,
      }));

      const errorMessage =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui status';

      setToast({
        id: Date.now(),
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-4 shadow-xs text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {/* Left side: Hamburger button + Title + Searchable Combobox */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 focus:outline-none shrink-0"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 hidden sm:flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="hidden xl:block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Pilih Kuesioner
              </span>
            </div>
          </div>

          {/* Searchable Combobox Component */}
          <div ref={comboboxRef} className="relative flex-1 max-w-md min-w-[130px] sm:min-w-[200px]">
            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                isOpen
                  ? 'border-[#DF1A3D] ring-2 ring-[#DF1A3D]/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/25 text-slate-800 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {selectedForm ? (
                  <>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isCurrentFormActive
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="truncate">{selectedForm.title}</span>
                  </>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    -- Silakan Pilih Kuesioner --
                  </span>
                )}
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#DF1A3D]' : ''
                }`}
              />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[360px] bg-white dark:bg-[#141414] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search Field */}
                <div className="p-2.5 bg-slate-50/50 dark:bg-white/[0.03]">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kuesioner..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/[0.06] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-[#DF1A3D] focus:ring-2 focus:ring-[#DF1A3D]/20 font-normal transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-white"
                        aria-label="Hapus teks pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Options List */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                  {/* Option to clear selection */}
                  <button
                    type="button"
                    onClick={() => handleSelectForm('')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-colors ${
                      !currentFormId
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#DF1A3D] font-semibold border border-rose-200 dark:border-rose-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>-- Kosongkan Pilihan --</span>
                    {!currentFormId && <Check className="w-4 h-4 text-[#DF1A3D] shrink-0" />}
                  </button>

                  {filteredForms.length > 0 ? (
                    filteredForms.map((form) => {
                      const isSelected = form.id === currentFormId;
                      const isActive = getFormIsActive(form);

                      return (
                        <button
                          key={form.id}
                          type="button"
                          onClick={() => handleSelectForm(form.id)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-all ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-[#DF1A3D]/20 text-[#DF1A3D] dark:text-white font-bold border border-rose-200 dark:border-[#DF1A3D]/40 shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#DF1A3D]" />
                              ) : (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                />
                              )}
                            </div>
                            <span className="truncate">{form.title}</span>
                          </div>

                          {/* Status Pill Badge */}
                          <div className="shrink-0">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Nonaktif
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <SearchX className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tidak ada kuesioner ditemukan
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Coba kata kunci lain atau hapus pencarian
                      </p>
                    </div>
                  )}
                </div>

                {/* Combobox Footer Status */}
                <div className="px-3.5 py-2 bg-slate-50/50 dark:bg-white/[0.02] text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    Menampilkan {filteredForms.length} dari {forms.length} kuesioner
                  </span>
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Esc untuk tutup</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Interactive Status Toggle Switch, Public Link, Theme Switcher & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {selectedForm ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Interactive Status Toggle Switch */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/[0.04] sm:bg-transparent px-2.5 sm:px-0 py-1.5 sm:py-0 rounded-xl border border-slate-200 dark:border-white/10 sm:border-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden md:inline">
                  Status:
                </span>

                {/* Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCurrentFormActive}
                  disabled={isToggling}
                  onClick={handleToggleStatus}
                  title={`Klik untuk ${
                    isCurrentFormActive ? 'menonaktifkan' : 'mengaktifkan'
                  } kuesioner`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400/40 ${
                    isCurrentFormActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-300 dark:bg-slate-700/80 hover:bg-slate-400 dark:hover:bg-slate-600/80'
                  } ${isToggling ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <span className="sr-only">Toggle status aktif kuesioner</span>
                  <span
                    className={`pointer-events-none flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                      isCurrentFormActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isToggling && (
                      <Loader2 className="w-3 h-3 text-slate-600 animate-spin" />
                    )}
                  </span>
                </button>

                {/* Label Status Badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                    isCurrentFormActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-white/10'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrentFormActive ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-slate-400'
                    }`}
                  />
                  <span className="hidden sm:inline">{isCurrentFormActive ? 'Aktif' : 'Nonaktif'}</span>
                </span>
              </div>

              {/* Public Form Link */}
              <a
                href={`/form/${selectedForm.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold shadow-xs transition-colors"
                title={`Buka formulir publik untuk ${selectedForm.title}`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#DF1A3D]" />
                <span className="hidden sm:inline">Form Publik</span>
              </a>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Pilih kuesioner
            </span>
          )}

          {/* Minimalist Theme Toggle (Light / Dark / System) */}
          <ThemeToggle />

          {/* Logout Action with Confirmation Modal */}
          <LogoutConfirmModal />
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border bg-white dark:bg-[#141414] backdrop-blur-2xl ${
              toast.type === 'success'
                ? 'border-emerald-200 dark:border-emerald-500/30 text-slate-900 dark:text-slate-100'
                : 'border-rose-200 dark:border-rose-500/30 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
