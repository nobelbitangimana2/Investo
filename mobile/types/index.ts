// ─────────────────────────────────────────────
// User & Auth
// ─────────────────────────────────────────────

export type UserRole = "admin" | "accountant" | "client";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// Client Profile
// ─────────────────────────────────────────────

export interface ClientProfile {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationalId?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  bankName?: Bank;
  accountNumber?: string;
  accountHolderName?: string;
  joinedAt?: string;
}

// ─────────────────────────────────────────────
// Enums / Literals
// ─────────────────────────────────────────────

export type Bank = "Bancobu" | "BCB" | "KCB" | "Ecobank";

export type InvestmentPeriod =
  | "Weekly"
  | "Monthly"
  | "3 Months"
  | "6 Months"
  | "1 Year"
  | "5 Years";

export type DepositStatus = "pending" | "confirmed" | "rejected";
export type WithdrawalStatus = "pending" | "confirmed" | "rejected";
export type InvestmentStatus = "active" | "matured" | "closed";

// ─────────────────────────────────────────────
// Deposit
// ─────────────────────────────────────────────

export interface Deposit {
  id: string;
  clientId: string;
  fullName: string;
  bank: Bank;
  accountNumber: string;
  amount: number;
  depositDate: string;
  referenceNumber: string;
  investmentPeriod: InvestmentPeriod;
  receiptUrl?: string;
  status: DepositStatus;
  rejectionNote?: string;
  submittedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

// ─────────────────────────────────────────────
// Withdrawal
// ─────────────────────────────────────────────

export interface Withdrawal {
  id: string;
  clientId: string;
  fullName: string;
  bankToTransferTo: Bank;
  accountNumber: string;
  recipientName: string;
  amount: number;
  status: WithdrawalStatus;
  rejectionNote?: string;
  requestedAt: string;
  confirmedAt?: string;
}

// ─────────────────────────────────────────────
// Investment
// ─────────────────────────────────────────────

export interface Investment {
  id: string;
  depositId: string;
  clientId: string;
  amount: number;
  currentPrincipal: number;
  accruedInterest: number;
  investmentPeriod: InvestmentPeriod;
  interestRate: number;
  expectedInterest: number;
  expectedMaturityValue: number;
  confirmationDate: string;
  maturityDate: string;
  status: InvestmentStatus;
}

// ─────────────────────────────────────────────
// Interest Rate
// ─────────────────────────────────────────────

export interface InterestRate {
  id: string;
  investmentPeriod: InvestmentPeriod;
  ratePercentage: number;
  dateUpdated: string;
}

// ─────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: "deposit" | "withdrawal" | "investment" | "system";
}

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  targetId?: string;
  targetType?: string;
}

// ─────────────────────────────────────────────
// Accountant Permissions
// ─────────────────────────────────────────────

export interface AccountantPermissions {
  userId: string;
  viewDeposits: boolean;
  viewWithdraws: boolean;
  confirmDeposits: boolean;
  rejectDeposits: boolean;
  confirmWithdraws: boolean;
  rejectWithdraws: boolean;
  generateReports: boolean;
}

// ─────────────────────────────────────────────
// Paginated response
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
