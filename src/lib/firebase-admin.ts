import { getApps, initializeApp, cert, deleteApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Bulletproof parser for Firebase Admin Credentials
 * Cleans wrapping quotes (single/double/escaped) added by Vercel or .env files,
 * and converts escaped '\n' literals into actual newlines.
 */
function parseCredentials() {
  // Ambil raw value private key
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';

  // 1. Buang tanda kutip ganda atau tunggal di awal dan akhir jika Vercel menyisipkannya
  let formatPrivateKey = rawPrivateKey
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\\"|\\"$/g, '');

  // 2. Ubah literal '\n' (teks) menjadi karakter newline yang sebenarnya (enter)
  formatPrivateKey = formatPrivateKey.replace(/\\n/g, '\n');

  // Ambil client email
  const rawClientEmail =
    process.env.FIREBASE_CLIENT_EMAIL ||
    process.env.FFIREBASE_CLIENT_EMAIL ||
    '';
  const clientEmail = rawClientEmail
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\\"|\\"$/g, '');

  // Ambil project ID
  const rawProjectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'sharing-vision-3fb3a';
  const projectId = rawProjectId
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^\\"|\\"$/g, '');

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  return {
    projectId,
    clientEmail,
    formatPrivateKey,
    serviceAccountJson,
  };
}

export function getAdminApp(): App {
  const { projectId, clientEmail, formatPrivateKey, serviceAccountJson } = parseCredentials();

  const apps = getApps();
  if (apps.length > 0) {
    const existingApp = apps[0];
    const hasCert = Boolean(existingApp.options.credential);

    // If existing app already has credentials, return it
    if (hasCert) {
      return existingApp;
    }

    // If existing app was an uncredentialed placeholder and we now have credentials, replace it
    if (clientEmail && formatPrivateKey) {
      try {
        deleteApp(existingApp);
      } catch {
        // ignore
      }
    } else {
      return existingApp;
    }
  }

  // 1. Primary: Use parsed clientEmail and privateKey from environment
  if (clientEmail && formatPrivateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formatPrivateKey,
        }),
        projectId,
      });
    } catch (certErr) {
      console.error('Failed to initialize Firebase Admin with credentials:', certErr);
    }
  }

  // 2. Secondary: Parse full service account JSON if provided
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

  // 3. Fallback when credentials are not yet configured or in mock/dev mode
  console.warn(
    '⚠️ [Firebase Admin] Kredensial Firebase Admin SDK belum lengkap. Pastikan FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY telah diset di environment variables.'
  );

  return initializeApp({
    projectId,
  });
}

// Proxies for adminAuth and adminDb so that initialization occurs lazily at runtime when environment is fully loaded
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
