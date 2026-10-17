'use client';

import { useState, useTransition } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
  Lock,
} from 'lucide-react';
import type { AdminUserRecord, CreateUserInput, UpdateUserInput } from '@/types/user';
import { createUserAction, deleteUserAction, updateUserAction, listUsersAction } from '@/actions/users';
import { formatSubmissionDate } from '@/lib/date';

interface UserManagementViewProps {
  initialUsers: AdminUserRecord[];
  initialError?: string | null;
}

export function UserManagementView({ initialUsers, initialError }: UserManagementViewProps) {
  const [users, setUsers] = useState<AdminUserRecord[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [userToEdit, setUserToEdit] = useState<AdminUserRecord | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState<CreateUserInput>({
    email: '',
    password: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Edit User
  const [editForm, setEditForm] = useState<{
    displayName: string;
    disabled: boolean;
    password: string;
  }>({
    displayName: '',
    disabled: false,
    password: '',
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Refresh user list
  const handleRefresh = () => {
    startTransition(async () => {
      const res = await listUsersAction();
      if (res.success && res.data) {
        setUsers(res.data);
        setErrorMessage(null);
        showToast('Daftar pengguna berhasil diperbarui.');
      } else {
        setErrorMessage(res.error || 'Gagal memuat daftar pengguna.');
      }
    });
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!addForm.email || !addForm.password) {
      setFormError('Email dan password wajib diisi.');
      return;
    }

    if (addForm.password.length < 6) {
      setFormError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    startTransition(async () => {
      const res = await createUserAction(addForm);
      if (res.success && res.data) {
        setUsers((prev) => [res.data!, ...prev]);
        setIsAddModalOpen(false);
        setAddForm({ email: '', password: '', displayName: '' });
        showToast(`Admin baru (${res.data.email}) berhasil dibuat.`);
      } else {
        setFormError(res.error || 'Gagal membuat pengguna baru.');
      }
    });
  };

  // Open Edit Modal
  const openEditModal = (user: AdminUserRecord) => {
    setUserToEdit(user);
    setEditForm({
      displayName: user.displayName || '',
      disabled: user.disabled,
      password: '',
    });
    setEditFormError(null);
  };

  // Handle Update User
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setEditFormError(null);

    const payload: UpdateUserInput = {
      uid: userToEdit.uid,
      displayName: editForm.displayName,
      disabled: editForm.disabled,
    };

    if (editForm.password.trim()) {
      if (editForm.password.length < 6) {
        setEditFormError('Password baru minimal 6 karakter.');
        return;
      }
      payload.password = editForm.password;
    }

    startTransition(async () => {
      const res = await updateUserAction(payload);
      if (res.success && res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.uid === userToEdit.uid ? { ...u, ...res.data! } : u))
        );
        setUserToEdit(null);
        showToast('Data admin berhasil diperbarui.');
      } else {
        setEditFormError(res.error || 'Gagal memperbarui admin.');
      }
    });
  };

  // Handle Delete User
  const handleDeleteUser = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const res = await deleteUserAction(userToDelete.uid);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
        showToast(`User (${userToDelete.email}) berhasil dihapus.`);
        setUserToDelete(null);
      } else {
        setErrorMessage(res.error || 'Gagal menghapus user.');
        setUserToDelete(null);
      }
    });
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => !u.disabled).length;
  const disabledUsers = totalUsers - activeUsers;

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Hero Banner / Header - Bento Style */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm p-6 sm:p-8 relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#DF1A3D] dark:bg-rose-500/15 dark:text-rose-300 border border-rose-200 dark:border-rose-400/30">
                <Users className="w-3.5 h-3.5 text-[#DF1A3D]" />
                Manajemen Admin
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-2.5 py-0.5 rounded-lg">
                Firebase Admin SDK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daftar Pengguna & Admin
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kelola akun administrator kuesioner secara aman melalui Firebase Authentication sisi server. Sesi login admin saat ini tetap terjaga tanpa terputus.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isPending}
              className="p-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.07] text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
              title="Perbarui data"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin text-[#DF1A3D]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] text-white shadow-md shadow-rose-900/10 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Admin Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bento Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Total Akun
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {totalUsers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Akun Aktif
              </span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeUsers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Nonaktif
              </span>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-600 dark:text-slate-400">
              {disabledUsers}
            </div>
          </div>
        </div>
      </div>

      {/* Warning/Guide if Error or Missing Credentials */}
      {errorMessage && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Pemberitahuan Kredensial Firebase Admin SDK
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                {errorMessage}
              </p>
              <div className="mt-3 p-3.5 bg-white dark:bg-black/30 rounded-2xl border border-amber-200/80 dark:border-amber-500/20 text-[11px] font-mono text-slate-700 dark:text-slate-300 space-y-1">
                <div className="text-xs font-semibold font-sans text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#DF1A3D]" />
                  Variabel yang dibutuhkan di file <code>.env.local</code>:
                </div>
                <div>FIREBASE_CLIENT_EMAIL=&quot;firebase-adminsdk-xxx@sharing-vision-3fb3a.iam.gserviceaccount.com&quot;</div>
                <div>FIREBASE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\nMIIEv...==\n-----END PRIVATE KEY-----\n&quot;</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Container - Bento Box */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200/80 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden transition-colors">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari email, nama, atau UID pengguna..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between sm:justify-end gap-2 px-1">
            <span>
              Menampilkan {filteredUsers.length} dari {users.length} pengguna
            </span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="py-4 px-4 sm:px-6">Pengguna</th>
                <th className="py-4 px-4 sm:px-6">UID Firebase</th>
                <th className="py-4 px-4 sm:px-6">Dibuat Pada</th>
                <th className="py-4 px-4 sm:px-6">Login Terakhir</th>
                <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                <th className="py-4 px-4 sm:px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-400 flex items-center justify-center mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        Tidak Ada Pengguna
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {search
                          ? 'Tidak ada akun yang sesuai dengan pencarian Anda.'
                          : 'Belum ada akun admin yang terdaftar. Tambahkan akun baru sekarang.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const initial = (user.displayName || user.email || 'A')
                    .charAt(0)
                    .toUpperCase();
                  const isCurrentCopied = copiedUid === user.uid;

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-[#A30018] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 dark:text-white truncate">
                              {user.displayName || 'Administrator'}
                            </span>
                            <span className="block text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* UID */}
                      <td className="py-4 px-4 sm:px-6 align-middle">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <span className="truncate max-w-[130px] sm:max-w-[180px]">
                            {user.uid}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUid(user.uid)}
                            className="p-1 hover:text-[#DF1A3D] transition-colors cursor-pointer"
                            title="Salin UID"
                          >
                            {isCurrentCopied ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Tanggal Dibuat */}
                      <td className="py-4 px-4 sm:px-6 align-middle text-slate-600 dark:text-slate-300 text-xs">
                        {user.creationTime
                          ? formatSubmissionDate(user.creationTime)
                          : '—'}
                      </td>

                      {/* Login Terakhir */}
                      <td className="py-4 px-4 sm:px-6 align-middle text-slate-600 dark:text-slate-400 text-xs">
                        {user.lastSignInTime ? (
                          formatSubmissionDate(user.lastSignInTime)
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 italic">
                            Belum pernah login
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 sm:px-6 align-middle text-center">
                        {user.disabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                            Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-4 px-4 sm:px-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Admin Baru */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setIsAddModalOpen(false)}
        >
          <div
            className="relative z-50 w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#DF1A3D] to-transparent" />

            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Tambah Administrator Baru
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Didaftarkan langsung ke Firebase Authentication (sisi server).
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Admin <span className="text-[#DF1A3D]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="admin@sharingvision.com"
                  className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap / Tampilan (Opsional)
                </label>
                <input
                  type="text"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password <span className="text-[#DF1A3D]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-4 pr-11 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Password awal ini dapat diganti oleh admin kapan saja.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Buat Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Admin */}
      {userToEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setUserToEdit(null)}
        >
          <div
            className="relative z-50 w-full max-w-lg bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#DF1A3D] to-transparent" />

            <button
              type="button"
              disabled={isPending}
              onClick={() => setUserToEdit(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-white flex items-center justify-center shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Edit Akun Admin
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  {userToEdit.email}
                </p>
              </div>
            </div>

            {editFormError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap / Tampilan
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Nama Administrator"
                  className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reset Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DF1A3D]/40 transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.disabled}
                    onChange={(e) => setEditForm({ ...editForm, disabled: e.target.checked })}
                    className="w-4 h-4 text-[#DF1A3D] rounded border-slate-300 focus:ring-[#DF1A3D]"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nonaktifkan akun ini (Pengguna tidak dapat login)
                  </span>
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setUserToEdit(null)}
                  className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#DF1A3D] to-[#A30018] hover:from-[#A30018] hover:to-[#DF1A3D] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Admin */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setUserToDelete(null)}
        >
          <div
            className="relative z-50 w-full max-w-md bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#DF1A3D] to-transparent" />

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[#DF1A3D] dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Hapus Pengguna Admin?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    {userToDelete.email}
                  </strong>
                  ? Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setUserToDelete(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteUser}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
