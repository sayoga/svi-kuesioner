'use client';

import { useState, useEffect } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MousePointerClick, ClipboardList } from 'lucide-react';
import { SeedDatabaseButton } from './SeedDatabaseButton';

interface AdminEmptyStateProps {
  message?: string;
  description?: string;
  showSeedButton?: boolean;
}

export function AdminEmptyState({
  message = 'Silakan Pilih Kuesioner',
  description = 'Silakan pilih kuesioner dari dropdown di atas untuk mulai melihat data.',
  showSeedButton = true,
}: AdminEmptyStateProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [hasData, setHasData] = useState<boolean>(true); // default true to avoid button flashing before check completes

  useEffect(() => {
    if (!isDev || !showSeedButton) return;

    let isMounted = true;
    async function checkSurveys() {
      if (!db) {
        if (isMounted) setHasData(true);
        return;
      }
      try {
        const formsRef = collection(db, 'forms');
        const q = query(formsRef, limit(1));
        const snapshot = await getDocs(q);
        if (isMounted) {
          setHasData(!snapshot.empty);
        }
      } catch (err) {
        console.error('Error checking surveys collection in AdminEmptyState:', err);
        if (isMounted) {
          setHasData(true);
        }
      }
    }

    checkSurveys();

    return () => {
      isMounted = false;
    };
  }, [isDev, showSeedButton]);

  const shouldRenderSeedButton = isDev && showSeedButton && !hasData;

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4">
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Brand Accent Bar: SHARING VISION Corporate Red */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#DF1A3D] to-[#A30018]" />
        
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-[#DF1A3D] dark:text-rose-400 mx-auto flex items-center justify-center mb-5 ring-8 ring-rose-50 dark:ring-rose-500/5 border border-rose-200 dark:border-rose-400/20">
          <MousePointerClick className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {message}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {description}
        </p>

        {shouldRenderSeedButton && (
          <div className="mb-6 pt-1">
            <SeedDatabaseButton
              variant="prominent"
              onSuccess={() => setHasData(true)}
            />
          </div>
        )}

        <div className="mt-2 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-center gap-2 text-xs text-[#DF1A3D] dark:text-rose-400 font-medium">
          <ClipboardList className="w-4 h-4" />
          <span>Gunakan pemilih formulir di bilah navigasi atas</span>
        </div>
      </div>
    </div>
  );
}
