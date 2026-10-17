'use server';

import { revalidatePath } from 'next/cache';
import { adminAuth } from '@/lib/firebase-admin';
import { logActivity } from '@/services/audit.service';
import type { AdminUserRecord, CreateUserInput, UpdateUserInput, UserManagementResult } from '@/types/user';

/**
 * Helper to extract human-friendly error messages from Firebase Admin Auth errors
 */
function parseAdminAuthError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('credential') || msg.includes('access token') || msg.includes('default credentials')) {
      return 'Kredensial Firebase Admin belum lengkap di .env.local. Harap masukkan FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY dari Service Account Firebase Console.';
    }
    if (msg.includes('auth/email-already-exists')) {
      return 'Email ini sudah terdaftar sebagai pengguna.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'Format alamat email tidak valid.';
    }
    if (msg.includes('auth/weak-password') || msg.includes('password must be a string at least 6 characters')) {
      return 'Password terlalu lemah (minimal 6 karakter).';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'Pengguna dengan UID tersebut tidak ditemukan.';
    }
    return msg;
  }
  return 'Terjadi kesalahan pada Firebase Admin SDK.';
}

/**
 * Mengambil daftar seluruh user dari Firebase Authentication
 */
export async function listUsersAction(): Promise<UserManagementResult<AdminUserRecord[]>> {
  try {
    const listResult = await adminAuth.listUsers(1000);
    const users: AdminUserRecord[] = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email || 'Tanpa Email',
      displayName: u.displayName || undefined,
      disabled: Boolean(u.disabled),
      creationTime: u.metadata?.creationTime,
      lastSignInTime: u.metadata?.lastSignInTime,
    }));

    // Sort by creationTime desc (terbaru di atas)
    users.sort((a, b) => {
      const timeA = a.creationTime ? new Date(a.creationTime).getTime() : 0;
      const timeB = b.creationTime ? new Date(b.creationTime).getTime() : 0;
      return timeB - timeA;
    });

    return {
      success: true,
      data: users,
    };
  } catch (error: unknown) {
    console.error('Error listing Firebase users:', error);
    return {
      success: false,
      error: parseAdminAuthError(error),
      data: [],
    };
  }
}

/**
 * Membuat user / admin baru via Firebase Admin SDK
 * Tidak menggunakan client SDK sehingga sesi login admin saat ini TIDAK terpengaruh.
 */
export async function createUserAction(
  input: CreateUserInput
): Promise<UserManagementResult<AdminUserRecord>> {
  const email = input.email?.trim().toLowerCase();
  const password = input.password;
  const displayName = input.displayName?.trim() || undefined;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email dan password wajib diisi.',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Password minimal terdiri dari 6 karakter.',
    };
  }

  try {
    const newUser = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    revalidatePath('/admin/users');

    // Audit log
    await logActivity({
      action: 'CREATE_USER',
      details: `Membuat akun admin baru: ${newUser.email} (UID: ${newUser.uid})`,
    });

    return {
      success: true,
      data: {
        uid: newUser.uid,
        email: newUser.email || email,
        displayName: newUser.displayName || displayName,
        disabled: Boolean(newUser.disabled),
        creationTime: newUser.metadata?.creationTime,
        lastSignInTime: newUser.metadata?.lastSignInTime,
      },
    };
  } catch (error: unknown) {
    console.error('Error creating Firebase user:', error);
    return {
      success: false,
      error: parseAdminAuthError(error),
    };
  }
}

/**
 * Memperbarui data user (nama, password baru, atau status aktif/nonaktif)
 */
export async function updateUserAction(
  input: UpdateUserInput
): Promise<UserManagementResult<AdminUserRecord>> {
  if (!input.uid) {
    return {
      success: false,
      error: 'UID pengguna wajib disertakan.',
    };
  }

  try {
    const updatePayload: {
      displayName?: string;
      password?: string;
      disabled?: boolean;
    } = {};

    if (input.displayName !== undefined) {
      updatePayload.displayName = input.displayName.trim();
    }
    if (input.password) {
      if (input.password.length < 6) {
        return {
          success: false,
          error: 'Password baru minimal terdiri dari 6 karakter.',
        };
      }
      updatePayload.password = input.password;
    }
    if (input.disabled !== undefined) {
      updatePayload.disabled = input.disabled;
    }

    const updatedUser = await adminAuth.updateUser(input.uid, updatePayload);

    revalidatePath('/admin/users');

    // Audit log
    await logActivity({
      action: 'UPDATE_USER',
      details: `Memperbarui akun admin: ${updatedUser.email} (UID: ${updatedUser.uid})`,
    });

    return {
      success: true,
      data: {
        uid: updatedUser.uid,
        email: updatedUser.email || '',
        displayName: updatedUser.displayName || undefined,
        disabled: Boolean(updatedUser.disabled),
        creationTime: updatedUser.metadata?.creationTime,
        lastSignInTime: updatedUser.metadata?.lastSignInTime,
      },
    };
  } catch (error: unknown) {
    console.error('Error updating Firebase user:', error);
    return {
      success: false,
      error: parseAdminAuthError(error),
    };
  }
}

/**
 * Menghapus user berdasarkan UID via Firebase Admin SDK
 */
export async function deleteUserAction(
  uid: string
): Promise<UserManagementResult<boolean>> {
  if (!uid) {
    return {
      success: false,
      error: 'UID pengguna wajib disertakan.',
    };
  }

  try {
    await adminAuth.deleteUser(uid);
    revalidatePath('/admin/users');

    // Audit log
    await logActivity({
      action: 'DELETE_USER',
      details: `Menghapus akun admin secara permanen (UID: ${uid})`,
    });
    return {
      success: true,
      data: true,
    };
  } catch (error: unknown) {
    console.error('Error deleting Firebase user:', error);
    return {
      success: false,
      error: parseAdminAuthError(error),
    };
  }
}
