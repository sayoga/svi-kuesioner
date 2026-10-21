'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, formatFirebaseError } from '@/lib/firebase';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Server action to authenticate an admin with email and password using Firebase.
 * Supports Firebase Auth and Firestore collections ('admins' or 'users').
 */
export async function loginAdminAction(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get('email') as string)?.trim() || '';
  const password = (formData.get('password') as string) || '';

  if (!email || !password) {
    return {
      success: false,
      error: 'Email dan password wajib diisi.',
    };
  }

  try {
    let authUser: { id: string; email: string; name?: string } | null = null;
    let token = '';

    // 1. First attempt: Firebase Auth
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      token = await user.getIdToken();
      authUser = {
        id: user.uid,
        email: user.email || email,
        name: user.displayName || 'Admin',
      };
    } catch {
      // 2. Fallback: Check Firestore 'admins' or 'users' collection using adminDb
      try {
        const { adminDb } = await import('@/lib/firebase-admin');
        if (adminDb) {
          const adminSnap = await adminDb.collection('admins').where('email', '==', email).get();

          if (!adminSnap.empty) {
            const docData = adminSnap.docs[0].data();
            if (docData.password === password) {
              token = `firebase-custom-token-${adminSnap.docs[0].id}-${Date.now()}`;
              authUser = {
                id: adminSnap.docs[0].id,
                email: docData.email || email,
                name: docData.name || docData.nama || 'Admin',
              };
            }
          } else {
            const userSnap = await adminDb.collection('users').where('email', '==', email).get();

            if (!userSnap.empty) {
              const docData = userSnap.docs[0].data();
              if (docData.password === password) {
                token = `firebase-custom-token-${userSnap.docs[0].id}-${Date.now()}`;
                authUser = {
                  id: userSnap.docs[0].id,
                  email: docData.email || email,
                  name: docData.name || docData.nama || 'Admin',
                };
              }
            }
          }
        } else if (db) {
          const adminsRef = collection(db, 'admins');
          const qAdmins = query(adminsRef, where('email', '==', email));
          const adminSnap = await getDocs(qAdmins);

          if (!adminSnap.empty) {
            const docData = adminSnap.docs[0].data();
            if (docData.password === password) {
              token = `firebase-custom-token-${adminSnap.docs[0].id}-${Date.now()}`;
              authUser = {
                id: adminSnap.docs[0].id,
                email: docData.email || email,
                name: docData.name || docData.nama || 'Admin',
              };
            }
          } else {
            const usersRef = collection(db, 'users');
            const qUsers = query(usersRef, where('email', '==', email));
            const userSnap = await getDocs(qUsers);

            if (!userSnap.empty) {
              const docData = userSnap.docs[0].data();
              if (docData.password === password) {
                token = `firebase-custom-token-${userSnap.docs[0].id}-${Date.now()}`;
                authUser = {
                  id: userSnap.docs[0].id,
                  email: docData.email || email,
                  name: docData.name || docData.nama || 'Admin',
                };
              }
            }
          }
        }
      } catch (firestoreErr) {
        console.error('Firestore admin check error:', firestoreErr);
      }
    }

    if (!authUser || !token) {
      return {
        success: false,
        error: 'Email atau password yang Anda masukkan salah.',
      };
    }

    // Save Auth token into Next.js HTTP-only cookies
    const cookieStore = await cookies();
    cookieStore.set('pb_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Also store user info for client display
    cookieStore.set(
      'pb_user',
      JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || 'Admin',
      }),
      {
        httpOnly: false, // accessible for UI header/display
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return {
      success: true,
      user: authUser,
    };
  } catch (err: unknown) {
    const formatted = formatFirebaseError(err);
    let friendlyMessage = formatted.message;

    if (
      formatted.status === 400 ||
      formatted.status === 401 ||
      formatted.message?.toLowerCase().includes('failed to authenticate') ||
      formatted.message?.toLowerCase().includes('invalid') ||
      formatted.message?.toLowerCase().includes('credential')
    ) {
      friendlyMessage = 'Email atau password yang Anda masukkan salah.';
    }

    return {
      success: false,
      error: friendlyMessage,
    };
  }
}

/**
 * Server action to sign out the admin and clear auth cookies.
 */
export async function logoutAdminAction(): Promise<{ success: boolean }> {
  try {
    await signOut(auth);
  } catch {
    // Ignore sign out error on server
  }

  const cookieStore = await cookies();
  cookieStore.delete('pb_auth');
  cookieStore.delete('pb_user');
  return { success: true };
}
