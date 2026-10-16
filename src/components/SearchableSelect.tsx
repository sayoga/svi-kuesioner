'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Check, X, SearchX } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '-- Pilih opsi jawaban --',
  error = false,
  disabled = false,
  onOpenChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const handleOpenChange = useCallback((newVal: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen((prev) => {
      const resolved = typeof newVal === 'function' ? newVal(prev) : newVal;
      onOpenChangeRef.current?.(resolved);
      return resolved;
    });
  }, []);

  // Filter options based on typed search query
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus the search field inside popover
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isOpen, handleOpenChange]);

  // Handle Escape key to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        handleOpenChange(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleOpenChange]);

  const handleSelect = (option: string) => {
    onChange(option);
    handleOpenChange(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-[9999]' : 'z-10'}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleOpenChange((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all cursor-pointer bg-white ${
          error
            ? 'border-rose-400 ring-2 ring-rose-200'
            : isOpen
            ? 'border-red-600 ring-2 ring-red-600/20 shadow-xs'
            : 'border-[#CBD5E1] hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <span
          className={`truncate font-medium ${
            value ? 'text-[#1E293B]' : 'text-[#94A3B8]'
          }`}
        >
          {value || placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-red-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] pointer-events-auto overflow-hidden divide-y divide-[#F1F5F9] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Input Bar */}
          <div className="p-2.5 bg-[#F8FAFC]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik untuk mencari opsi..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#CBD5E1] bg-white text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 font-normal transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[#94A3B8] hover:text-[#0F172A]"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const isSelected = option === value;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 text-red-600 font-semibold border-l-2 border-red-600'
                        : 'text-[#1E293B] hover:bg-slate-50 hover:text-red-600'
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 px-4 text-center">
                <SearchX className="w-7 h-7 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-medium text-[#1E293B]">
                  Tidak ada opsi ditemukan
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Coba kata kunci pencarian yang lain
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3.5 py-2 bg-[#F8FAFC] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>
              {filteredOptions.length} dari {options.length} opsi tersedia
            </span>
            <span className="hidden sm:inline text-[#94A3B8]">Esc untuk tutup</span>
          </div>
        </div>
      )}
    </div>
  );
}
