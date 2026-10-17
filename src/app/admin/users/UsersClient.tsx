'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { listUsersAction } from '@/actions/users';
import { UserManagementView } from '@/components/UserManagementView';
import { UsersTableSkeleton } from './loading';
import type { AdminUserRecord } from '@/types/user';

function UserManagementContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const result = await listUsersAction();
        if (isMounted) {
          if (result.success && result.data) {
            setUsers(result.data);
          } else {
            setError(result.error || 'Gagal memuat data pengguna');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <UsersTableSkeleton />;
  }

  return (
    <UserManagementView
      initialUsers={users}
      initialError={error}
    />
  );
}

export default function UsersClient() {
  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Memuat data...</div>}>
        <UserManagementContent />
      </Suspense>
    </main>
  );
}
