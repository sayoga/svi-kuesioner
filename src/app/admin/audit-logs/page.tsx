'use client';

import dynamic from 'next/dynamic';

const AuditClient = dynamic(() => import('./AuditClient'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
      Memuat log aktivitas...
    </div>
  ),
});

export default function Page() {
  return <AuditClient />;
}
