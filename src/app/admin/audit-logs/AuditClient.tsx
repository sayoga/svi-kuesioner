'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchAuditLogsAction } from '@/actions/audit';
import { AuditLogsView } from '@/components/AuditLogsView';
import { AuditLogsSkeleton } from './loading';
import type { AuditLogRecord } from '@/types/audit';

function AuditTrailContent() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        const res = await fetchAuditLogsAction(50);
        if (isMounted && res.success && res.data) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error('Gagal memuat log aktivitas:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <AuditLogsSkeleton />;
  }

  return <AuditLogsView initialLogs={logs} />;
}

export default function AuditClient() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Memuat data...</div>}>
        <AuditTrailContent />
      </Suspense>
    </main>
  );
}
