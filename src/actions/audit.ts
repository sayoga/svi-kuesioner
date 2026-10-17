'use server';

import { getAuditLogs, logActivity, getCurrentAdminEmail } from '@/services/audit.service';
import type { AuditLogRecord, LogActivityParams } from '@/types/audit';

export async function fetchAuditLogsAction(maxLogs = 50): Promise<{
  success: boolean;
  data: AuditLogRecord[];
  error?: string;
}> {
  try {
    const logs = await getAuditLogs(maxLogs);
    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memuat log aktivitas';
    return {
      success: false,
      data: [],
      error: message,
    };
  }
}

export async function recordAuditAction(params: LogActivityParams): Promise<boolean> {
  const result = await logActivity(params);
  return Boolean(result);
}

export { logActivity, getCurrentAdminEmail };
