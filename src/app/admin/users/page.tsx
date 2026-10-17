import { Suspense } from 'react';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { listUsersAction } from '@/actions/users';
import { UserManagementView } from '@/components/UserManagementView';
import { UsersTableSkeleton } from './loading';

export const metadata: Metadata = {
  title: 'Manajemen Pengguna & Admin | SHARING VISION™',
  description: 'Kelola akun administrator kuesioner dan hak akses Firebase Authentication',
};

async function UsersPageContent() {
  await connection();
  const result = await listUsersAction();

  return (
    <Suspense fallback={<UsersTableSkeleton />}>
      <UserManagementView
        initialUsers={result.data || []}
        initialError={result.success ? null : result.error}
      />
    </Suspense>
  );
}

export default function AdminUsersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersPageContent />
      </Suspense>
    </div>
  );
}
