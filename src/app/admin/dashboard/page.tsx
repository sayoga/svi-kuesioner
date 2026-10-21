import { Suspense } from 'react';
import { connection } from 'next/server';
import { responsesService } from '@/services/responses.service';
import { DashboardChartsView } from '@/components/DashboardChartsView';
import { AdminEmptyState } from '@/components/AdminEmptyState';
import { SeedDatabaseButton } from '@/components/SeedDatabaseButton';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard Analitik | SHARING VISION™',
  description: 'Ringkasan metrik dan visualisasi grafik kuesioner',
};

interface PageProps {
  searchParams: Promise<{ formId?: string }>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Title skeleton */}
      <div className="h-32 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 flex flex-col justify-center">
        <div className="h-6 bg-slate-300 dark:bg-white/10 rounded-xl w-1/3 mb-2.5" />
        <div className="h-4 bg-slate-300/60 dark:bg-white/5 rounded-lg w-1/2" />
      </div>

      {/* 4 Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-36 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6"
          />
        ))}
      </div>

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-3 h-96 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6" />
        <div className="col-span-1 h-96 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6" />
        <div className="col-span-1 md:col-span-2 lg:col-span-2 h-96 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6" />
        <div className="col-span-1 md:col-span-2 lg:col-span-2 h-96 bg-slate-200/80 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 p-6" />
      </div>
    </div>
  );
}

async function DashboardPageContent({ searchParams }: PageProps) {
  // Opt into dynamic rendering inside Suspense boundary to prevent blocking prerendering
  await connection();

  const resolvedParams = await searchParams;
  const formId = resolvedParams?.formId;

  if (!formId) {
    return (
      <AdminEmptyState
        message="Silakan Pilih Kuesioner"
        description="Silakan pilih kuesioner dari dropdown di atas untuk mulai melihat data ringkasan dan diagram analitik."
      />
    );
  }

  let analytics = null;
  let form = null;
  let errorMsg: string | null = null;

  try {
    const { formsService } = await import('@/services/forms.service');
    [analytics, form] = await Promise.all([
      responsesService.getFormAnalytics(formId),
      formsService.getFormById(formId).catch(() => null),
    ]);
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Gagal memuat analitik kuesioner.';
  }

  if (errorMsg || !analytics) {
    return (
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-rose-200 dark:border-rose-500/30 p-8 sm:p-10 text-center max-w-lg mx-auto shadow-sm my-12 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/15 text-[#DF1A3D] dark:text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-500/30">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
          Tidak Dapat Memuat Analitik
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
          {errorMsg || 'Formulir dengan ID tersebut tidak ditemukan.'}
        </p>
        <div className="flex justify-center">
          <SeedDatabaseButton variant="prominent" />
        </div>
      </div>
    );
  }

  return <DashboardChartsView analytics={analytics} form={form || undefined} />;
}

export default function AdminDashboardPage({ searchParams }: PageProps) {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
