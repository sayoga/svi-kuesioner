import { getApps, initializeApp, cert, deleteApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();

  // Strip wrapping double or single quotes if present from .env parsing
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }

  // Parse escaped \n characters into real newlines
  formatted = formatted.replace(/\\n/g, '\n');

  return formatted;
}

export function getAdminApp(): App {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'sharing-vision-3fb3a';

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FFIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  const privateKey = formatPrivateKey(rawPrivateKey);

  const apps = getApps();
  if (apps.length > 0) {
    const existingApp = apps[0];
    const hasCert = Boolean(existingApp.options.credential);

    // If the existing app already has credentials, or we still don't have credentials to upgrade, return it
    if (hasCert || (!clientEmail && !serviceAccountJson)) {
      return existingApp;
    }

    // Otherwise, previous app was an uncredentialed fallback, delete it and upgrade with credentials
    try {
      deleteApp(existingApp);
    } catch {
      // ignore
    }
  }

  // 1. Service account JSON string
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  // 2. Individual clientEmail and privateKey from environment
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // Fallback when credentials are not yet configured or in mock/dev mode
  console.warn(
    '⚠️ [Firebase Admin] Kredensial Firebase Admin SDK belum lengkap. Pastikan FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY telah diset di .env.local.'
  );

  return initializeApp({
    projectId,
  });
}

// Proxies for adminAuth and adminDb so that initialization occurs at runtime when environment is fully loaded
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const authInstance = getAuth(getAdminApp());
    const value = (authInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(authInstance);
    }
    return value;
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const dbInstance = getFirestore(getAdminApp());
    const value = (dbInstance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(dbInstance);
    }
    return value;
  },
});

export default getAdminApp;
