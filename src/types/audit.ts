export type AuditActionType =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CREATE_FORM'
  | 'UPDATE_FORM'
  | 'DELETE_FORM'
  | 'CHANGE_FORM_STATUS'
  | 'DELETE_RESPONSE'
  | 'LOGIN_ADMIN'
  | string;

export interface AuditLogRecord {
  id: string;
  action: AuditActionType;
  performedBy: string;
  performedByName?: string;
  details: string | Record<string, unknown>;
  timestamp: string; // ISO string for client hydration/rendering
}

export interface LogActivityParams {
  action: AuditActionType;
  performedBy?: string;
  performedByName?: string;
  details: string | Record<string, unknown>;
}
