// ==========================================
// FINANCEOS STRICT DATA TYPES
// ==========================================

export enum Role {
  USER = 'USER',
  AGENT = 'AGENT',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN'
}

export interface Profile {
  id: string; // UUID
  role: Role;
  finance_tag: string;
  account_status: AccountStatus;
  full_name: string;
  phone_number: string;
}

export interface Wallet {
  id: string; // UUID
  profile_id: string; // Linked to Profile
  balance: number; // MUST be a strict number for math
  escrow_balance: number;
}

export interface TelemetryLog {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL_ERROR';
  source: string;
  message: string;
  user_tag?: string;
  resolved: boolean;
  created_at: string;
}

// Pagination Interface for the Admin Dashboard
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
}