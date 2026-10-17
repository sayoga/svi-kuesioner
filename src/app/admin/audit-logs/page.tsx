import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { getAuditLogs } from '@/services/audit.service';
import { AuditLogsView } from '@/components/AuditLogsView';
import { AuditLogsSkeleton } from './loading';

export const metadata: Metadata = {
  title: 'Audit Trail & Log Aktivitas | SHARING VISION™',
  description: 'Catatan log aktivitas krusial administrator dan keamanan sistem kuesioner',
};

async function AuditLogsContent() {
  await connection();
  const logs = await getAuditLogs(50);

  return (
    <Suspense fallback={<AuditLogsSkeleton />}>
      <AuditLogsView initialLogs={logs} />
    </Suspense>
  );
}

export default function AuditLogsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<AuditLogsSkeleton />}>
        <AuditLogsContent />
      </Suspense>
    </div>
  );
}
