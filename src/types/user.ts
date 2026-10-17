export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName?: string;
  disabled: boolean;
  creationTime?: string;
  lastSignInTime?: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface UpdateUserInput {
  uid: string;
  displayName?: string;
  password?: string;
  disabled?: boolean;
}

export interface UserManagementResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
