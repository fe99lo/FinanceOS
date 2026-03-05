// ------------------------------------------
// 1. BRANDED TYPES (Zero-cost memory safety)
// ------------------------------------------
export type ProfileId = string & { readonly __brand: unique symbol };
export type WalletId = string & { readonly __brand: unique symbol };
export type TransactionId = string & { readonly __brand: unique symbol };
export type IsoDateString = string & { readonly __brand: unique symbol };
export type DarajaReceipt = string & { readonly __brand: unique symbol };

/**
 * MONEY REPRESENTATION
 * ALL financial values must be handled in the lowest denomination (cents/pesewas).
 * Example: $150.50 USD is represented as 15050.
 * This mathematically eliminates JavaScript floating-point rounding errors.
 */
export type Cents = number & { readonly __brand: unique symbol };

// ------------------------------------------
// 2. DOMAIN ENUMS (Memory efficient)
// ------------------------------------------
export const enum AccountRole {
  USER = 'USER',
  AGENT = 'AGENT',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export const enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  FLAGGED_AML = 'FLAGGED_AML' // Anti-Money Laundering lock
}

export const enum TransactionType {
  DEPOSIT_MPESA = 'DEPOSIT_MPESA',
  WITHDRAWAL_MPESA = 'WITHDRAWAL_MPESA',
  P2P_TRANSFER = 'P2P_TRANSFER',
  AGENT_FLOAT_ALLOCATION = 'AGENT_FLOAT_ALLOCATION',
  SYSTEM_FEE = 'SYSTEM_FEE'
}

export const enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

export const enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL_ERROR = 'CRITICAL_ERROR'
}

// ------------------------------------------
// 3. STRICT DOMAIN ERRORS
// ------------------------------------------
export const enum ErrorCode {
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  ACCOUNT_FROZEN = 'ACCOUNT_FROZEN',
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  UNAUTHORIZED_ACTION = 'UNAUTHORIZED_ACTION',
  DATABASE_LOCK = 'DATABASE_LOCK'
}

export interface FinanceOSError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly internalDetails?: string;
}

// ------------------------------------------
// 4. CORE DATA INTERFACES
// ------------------------------------------
export interface Profile {
  readonly id: ProfileId;
  readonly role: AccountRole;
  readonly finance_tag: string;
  readonly account_status: AccountStatus;
  readonly full_name: string;
  readonly phone_number: string;
  readonly created_at: IsoDateString;
}

export interface Wallet {
  readonly id: WalletId;
  readonly profile_id: ProfileId;
  readonly balance: Cents; 
  readonly escrow_balance: Cents;
  readonly updated_at: IsoDateString;
}

export interface Transaction {
  readonly id: TransactionId;
  readonly wallet_id: WalletId;
  readonly type: TransactionType;
  readonly amount: Cents; // Negative for debits, Positive for credits
  readonly status: TransactionStatus;
  readonly reference_id?: DarajaReceipt | TransactionId; // Links to M-Pesa or the opposing double-entry record
  readonly description: string;
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

// ------------------------------------------
// 5. FUNCTIONAL RETURN PATTERNS
// ------------------------------------------
/**
 * The Monadic Result Pattern
 * Eliminates unhandled UI crashes. Forces the engineer to check `res.ok`.
 */
export type Result<T, E = FinanceOSError> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Cursor Pagination State
 * O(1) time complexity for infinite scrolling, safely handling millions of rows.
 */
export interface CursorPage<T> {
  readonly data: T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}