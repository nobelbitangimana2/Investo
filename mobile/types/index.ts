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
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  joinedAt?: string;
}

// ─────────────────────────────────────────────
// Enums / Literals
// ─────────────────────────────────────────────

// All partner bank names are dynamic — no longer a hardcoded enum
export type Bank = string;

// Investment period is now free-text (e.g. "3 Months", "1 Year", "18 Months")
export type InvestmentPeriod = string;

export type DepositStatus = "pending" | "confirmed" | "rejected";
export type WithdrawalStatus = "pending" | "confirmed" | "rejected";
export type InvestmentStatus = "active" | "matured" | "closed";

// ─────────────────────────────────────────────
// Partner Bank (from /partner-banks/active)
// ─────────────────────────────────────────────

export interface PartnerBank {
  id: string;
  name: string;
  icon?: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  investmentPeriod: string; // free-text period name stored by admin
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
