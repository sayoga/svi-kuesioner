'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Database, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { seedDatabase } from '@/lib/seed';

interface SeedDatabaseButtonProps {
  variant?: 'default' | 'prominent';
  className?: string;
  onSuccess?: () => void;
}

export function SeedDatabaseButton({
  variant = 'default',
  className = '',
  onSuccess,
}: SeedDatabaseButtonProps) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';
  const [hasData, setHasData] = useState<boolean>(true); // default true to avoid flash
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!isDev) {
      setHasData(true);
      setIsChecking(false);
      return;
    }

    let isMounted = true;
    async function checkExistingData() {
      if (!db) {
        if (isMounted) {
          setHasData(true);
          setIsChecking(false);
        }
        return;
      }
      try {
        const formsRef = collection(db, 'forms');
        const q = query(formsRef, limit(1));
        const snapshot = await getDocs(q);
        if (isMounted) {
          setHasData(!snapshot.empty);
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error checking surveys collection:', err);
        if (isMounted) {
          setHasData(true);
          setIsChecking(false);
        }
      }
    }

    checkExistingData();

    return () => {
      isMounted = false;
    };
  }, [isDev]);

  const handleSeed = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    setStatusMessage(null);

    try {
      const result = await seedDatabase();

      // Immediately hide button upon successful seeding
      setHasData(true);
      if (onSuccess) {
        onSuccess();
      }

      setStatusMessage({
        type: 'success',
        text: `Berhasil membuat ${result.totalQuestions} pertanyaan dan ${result.totalResponses} respons dummy.`,
      });

      // Automatically refresh and navigate to the newly seeded survey dashboard
      setTimeout(() => {
        router.push(`/admin/dashboard?formId=${result.surveyId}`);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      console.error('Seeding error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal melakukan seed database';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Only render if environment is development AND surveys collection is completely empty
  if (!isDev || isChecking || hasData) {
    return null;
  }

  if (variant === 'prominent') {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSeed}
          disabled={isSeeding}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#DF1A3D] to-[#B00E2C] hover:from-[#E82B4E] hover:to-[#C21535] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memasukkan Data Dummy ke Firestore...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Seed Database (Demo Data)</span>
            </>
          )}
        </button>

        {statusMessage && (
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSeed}
        disabled={isSeeding}
        title="Generate data dummy kuesioner, pertanyaan, dan respons langsung ke Firestore"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-xs active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
          isSeeding
            ? 'bg-slate-100 dark:bg-white/10 text-slate-500 border-slate-200 dark:border-white/10'
            : 'bg-white dark:bg-[#141414] hover:bg-rose-50 dark:hover:bg-rose-500/10 border-slate-200 dark:border-white/15 hover:border-rose-300 dark:hover:border-rose-500/40 text-slate-700 dark:text-slate-200 hover:text-[#DF1A3D] dark:hover:text-rose-400'
        } ${className}`}
      >
        {isSeeding ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DF1A3D]" />
            <span>Seeding Firestore...</span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5 text-[#DF1A3D]" />
            <span>Seed Database</span>
          </>
        )}
      </button>

      {statusMessage && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 whitespace-nowrap flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
