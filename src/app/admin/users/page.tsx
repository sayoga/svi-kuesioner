'use client';

import dynamic from 'next/dynamic';

const UsersClient = dynamic(() => import('./UsersClient'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
      Memuat portal admin...
    </div>
  ),
});

export default function Page() {
  return <UsersClient />;
}
