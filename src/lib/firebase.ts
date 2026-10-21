import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    'AIzaSyDYhrFnN79EYN1sf0W2MAM634vKgDy4SeU',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN ||
    'sharing-vision-3fb3a.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'sharing-vision-3fb3a',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    'sharing-vision-3fb3a.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    '130099179975',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    process.env.FIREBASE_APP_ID ||
    '1:130099179975:web:661090e4e59731e14aa9e2',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern to prevent re-initializing Firebase in Next.js Hot Reload
export const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Cloud Firestore and Auth
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

export default db;

export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: Record<string, unknown> | null;
}

/**
 * Formats Firebase Firestore / Auth or generic errors into a standardized response
 */
export function formatFirebaseError(error: unknown): ApiErrorResponse {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const fbErr = error as { code: string; message: string };
    let status = 500;
    if (fbErr.code.includes('not-found')) status = 404;
    else if (fbErr.code.includes('already-exists')) status = 409;
    else if (
      fbErr.code.includes('permission-denied') ||
      fbErr.code.includes('unauthenticated') ||
      fbErr.code.includes('invalid-credential')
    ) {
      status = 401;
    } else if (fbErr.code.includes('invalid-argument')) {
      status = 400;
    }

    return {
      status,
      message: fbErr.message || 'Firebase request failed',
      details: { code: fbErr.code },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      details: null,
    };
  }

  return {
    status: 500,
    message: 'An unexpected error occurred',
    details: null,
  };
}
