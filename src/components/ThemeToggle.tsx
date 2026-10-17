'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-24 h-8 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 animate-pulse shrink-0" />
    );
  }

  return (
    <div
      role="group"
      aria-label="Pilih Tema"
      className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#181818] border border-slate-200 dark:border-white/10 shadow-xs transition-colors shrink-0"
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Mode Terang (Light)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-amber-500 shadow-sm scale-105 ring-1 ring-slate-200/60 font-bold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        aria-label="Mode Terang"
        aria-pressed={theme === 'light'}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Mode Gelap (Dark)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-[#242424] text-cyan-400 shadow-sm scale-105 ring-1 ring-white/10 font-bold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        aria-label="Mode Gelap"
        aria-pressed={theme === 'dark'}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="Otomatis Sistem (System)"
        className={`p-1.5 rounded-full transition-all cursor-pointer ${
          theme === 'system'
            ? 'bg-white dark:bg-[#242424] text-[#DF1A3D] shadow-sm scale-105 ring-1 ring-slate-200/60 dark:ring-white/10 font-bold'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        aria-label="Ikuti Sistem"
        aria-pressed={theme === 'system'}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
