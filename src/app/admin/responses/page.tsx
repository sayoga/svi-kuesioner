import { Suspense } from 'react';
import { connection } from 'next/server';
import { responsesService } from '@/services/responses.service';
import { TextResponsesTableView } from '@/components/TextResponsesTableView';
import { AdminEmptyState } from '@/components/AdminEmptyState';
import { TableLayoutSkeleton } from './loading';
import { AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tanggapan Responden | SHARING VISION™',
  description: 'Tabel terpadu jawaban teks dan umpan balik responden',
};

interface PageProps {
  searchParams: Promise<{ formId?: string }>;
}

async function ResponsesContent({ searchParams }: PageProps) {
  await connection();
  const resolvedParams = await searchParams;
  const formId = resolvedParams?.formId;

  if (!formId) {
    return (
      <AdminEmptyState
        message="Silakan Pilih Kuesioner"
        description="Silakan pilih kuesioner dari dropdown di atas untuk melihat tabel tanggapan responden."
      />
    );
  }

  let analytics = null;
  let errorMsg: string | null = null;

  try {
    analytics = await responsesService.getFormAnalytics(formId);
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Gagal memuat tanggapan kuesioner.';
  }

  if (errorMsg || !analytics) {
    return (
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-rose-500/30 p-8 text-center max-w-lg mx-auto shadow-sm my-12 text-slate-900 dark:text-slate-50 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-[#DF1A3D] dark:text-rose-400 mx-auto flex items-center justify-center mb-3 border border-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Tidak Dapat Memuat Tanggapan
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {errorMsg || 'Formulir dengan ID tersebut tidak ditemukan.'}
        </p>
      </div>
    );
  }

  return <TextResponsesTableView analytics={analytics} />;
}

export default function ResponsesPage({ searchParams }: PageProps) {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<TableLayoutSkeleton />}>
        <ResponsesContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
