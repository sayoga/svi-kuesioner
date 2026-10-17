import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import type { AuditLogRecord, LogActivityParams } from '@/types/audit';

export const AUDIT_COLLECTION = 'audit_logs';

/**
 * Helper to get currently logged-in admin identity from cookies
 */
export async function getCurrentAdminEmail(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('pb_user')?.value;
    if (userCookie) {
      const parsed = JSON.parse(userCookie);
      return parsed.email || parsed.name || parsed.id || 'Admin';
    }
  } catch {
    // ignore cookie reading errors
  }
  return 'system@sharingvision.com';
}

/**
 * Log activity helper function
 * Can be called with (action, performedBy, details) or with an object parameter { action, performedBy, details }
 */
export async function logActivity(
  actionOrParams: string | LogActivityParams,
  performedByArg?: string,
  detailsArg?: string | Record<string, unknown>
): Promise<string | null> {
  let action: string;
  let performedBy: string | undefined;
  let details: string | Record<string, unknown> = '';

  if (typeof actionOrParams === 'object') {
    action = actionOrParams.action;
    performedBy = actionOrParams.performedBy;
    details = actionOrParams.details || '';
  } else {
    action = actionOrParams;
    performedBy = performedByArg;
    details = detailsArg || '';
  }

  // Resolve actor if not provided
  if (!performedBy) {
    performedBy = await getCurrentAdminEmail();
  }

  const nowIso = new Date().toISOString();
  const logData = {
    action,
    performedBy,
    details: typeof details === 'string' ? details : JSON.stringify(details),
    timestamp: nowIso,
    created_at: nowIso,
  };

  try {
    // 1. Try Firebase Admin Firestore
    if (adminDb) {
      try {
        const ref = await adminDb.collection(AUDIT_COLLECTION).add(logData);
        return ref.id;
      } catch (adminErr) {
        console.warn('Fallback to client Firestore for audit logging:', adminErr);
      }
    }

    // 2. Fallback to client Firestore SDK
    const fallbackRef = await addDoc(collection(db, AUDIT_COLLECTION), logData);
    return fallbackRef.id;
  } catch (error) {
    console.error('Failed to record audit log:', error);
    return null;
  }
}

/**
 * Fetch recent audit logs ordered by timestamp desc (default limit: 50)
 */
export async function getAuditLogs(maxLogs = 50): Promise<AuditLogRecord[]> {
  try {
    // 1. Try via Firebase Admin Firestore
    if (adminDb) {
      try {
        const snapshot = await adminDb
          .collection(AUDIT_COLLECTION)
          .orderBy('timestamp', 'desc')
          .limit(maxLogs)
          .get();

        if (!snapshot.empty) {
          return snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let details = data.details || '';
            // If details is stored as JSON string, attempt parsing for cleaner display
            if (typeof details === 'string' && (details.startsWith('{') || details.startsWith('['))) {
              try {
                details = JSON.parse(details);
              } catch {
                // keep string
              }
            }

            return {
              id: docSnap.id,
              action: data.action || 'ACTIVITY',
              performedBy: data.performedBy || 'Unknown',
              details,
              timestamp: data.timestamp || data.created_at || new Date().toISOString(),
            };
          });
        }
      } catch (adminErr) {
        console.warn('Fallback fetching audit logs to client SDK:', adminErr);
      }
    }

    // 2. Fallback via Client SDK
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy('timestamp', 'desc'),
      firestoreLimit(maxLogs)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let details = data.details || '';
      if (typeof details === 'string' && (details.startsWith('{') || details.startsWith('['))) {
        try {
          details = JSON.parse(details);
        } catch {
          // keep string
        }
      }

      return {
        id: docSnap.id,
        action: data.action || 'ACTIVITY',
        performedBy: data.performedBy || 'Unknown',
        details,
        timestamp: data.timestamp || data.created_at || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}
