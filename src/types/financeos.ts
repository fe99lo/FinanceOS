// ==========================================
// ENTERPRISE DOMAIN TYPES (financeos.ts)
// ==========================================

// 1. BRANDED TYPES (Memory zero-cost, compile-time absolute safety)
export type ProfileId = string & { readonly __brand: unique symbol };
export type WalletId = string & { readonly __brand: unique symbol };
export type TransactionId = string & { readonly __brand: unique symbol };
export type IsoDateString = string & { readonly __brand: unique symbol };

// 2. CONST ENUMS (Compiles away to raw strings, saving memory)
export const enum AccountRole {
  USER = 'USER',
  AGENT = 'AGENT',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export const enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN'
}

export const enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL_ERROR = 'CRITICAL_ERROR'
}

// 3. STRICT INTERFACES
export interface Profile {
  readonly id: ProfileId;
  readonly role: AccountRole;
  readonly finance_tag: string;
  readonly account_status: AccountStatus;
  readonly full_name: string;
  readonly phone_number: string;
  readonly created_at: IsoDateString;
}

export interface TelemetryLog {
  readonly id: string;
  readonly severity: LogSeverity;
  readonly source: string;
  readonly message: string;
  readonly user_tag?: string;
  readonly resolved: boolean;
  readonly created_at: IsoDateString;
}

// 4. THE MONADIC RESULT PATTERN (Never throw silent errors again)
// Forces the UI to explicitly check 'if (res.ok)' before accessing data
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// 5. CURSOR PAGINATION STATE
// Required for querying millions of rows without crashing the DB
export interface CursorPage<T> {
  readonly data: T[];
  readonly nextCursor: string | null; // Null means end of list
  readonly hasMore: boolean;
}