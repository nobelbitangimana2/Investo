/**
 * Mock API layer — swap each function body for a real fetch/axios call
 * when the backend is ready. All signatures stay identical.
 */

import type {
  User,
  ClientProfile,
  Deposit,
  Withdrawal,
  Investment,
  InterestRate,
  Notification,
  AuditLogEntry,
  AccountantPermissions,
  DepositFormData,
  WithdrawalFormData,
} from "@/types";

import {
  mockUsers,
  mockClientProfiles,
  mockDeposits,
  mockWithdrawals,
  mockInvestments,
  mockInterestRates,
  mockNotifications,
  mockAuditLogs,
  mockAccountantPermissions,
} from "./mock-data";

// In-memory mutable stores (simulate a database)
let _users = [...mockUsers];
let _profiles = [...mockClientProfiles];
let _deposits = [...mockDeposits];
let _withdrawals = [...mockWithdrawals];
let _investments = [...mockInvestments];
let _rates = [...mockInterestRates];
let _notifications = [...mockNotifications];
let _auditLogs = [...mockAuditLogs];
let _permissions = [...mockAccountantPermissions];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export async function mockLogin(email: string, _password: string): Promise<User | null> {
  await delay();
  return _users.find((u) => u.email === email && u.status === "active") ?? null;
}

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  await delay();
  return [..._users];
}

export async function getUserById(id: string): Promise<User | null> {
  await delay();
  return _users.find((u) => u.id === id) ?? null;
}

export async function getClients(): Promise<User[]> {
  await delay();
  return _users.filter((u) => u.role === "client");
}

export async function getAccountants(): Promise<User[]> {
  await delay();
  return _users.filter((u) => u.role === "accountant");
}

export async function createAccountant(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  await delay();
  const user: User = {
    id: genId("u-acc"),
    name: data.name,
    email: data.email,
    role: "accountant",
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  };
  _users = [..._users, user];
  const perms: AccountantPermissions = {
    userId: user.id,
    viewDeposits: false,
    viewWithdraws: false,
    confirmDeposits: false,
    rejectDeposits: false,
    confirmWithdraws: false,
    rejectWithdraws: false,
    generateReports: false,
  };
  _permissions = [..._permissions, perms];
  return user;
}

export async function updateUserStatus(id: string, status: "active" | "suspended"): Promise<User> {
  await delay();
  _users = _users.map((u) => (u.id === id ? { ...u, status } : u));
  return _users.find((u) => u.id === id)!;
}

// ─────────────────────────────────────────────
// Client Profiles
// ─────────────────────────────────────────────

export async function getClientProfile(userId: string): Promise<ClientProfile | null> {
  await delay();
  return _profiles.find((p) => p.userId === userId) ?? null;
}

export async function updateClientProfile(
  userId: string,
  data: Partial<ClientProfile>
): Promise<ClientProfile> {
  await delay();
  _profiles = _profiles.map((p) => (p.userId === userId ? { ...p, ...data } : p));
  return _profiles.find((p) => p.userId === userId)!;
}

// ─────────────────────────────────────────────
// Deposits
// ─────────────────────────────────────────────

export async function getDeposits(clientId?: string): Promise<Deposit[]> {
  await delay();
  return clientId ? _deposits.filter((d) => d.clientId === clientId) : [..._deposits];
}

export async function getDepositById(id: string): Promise<Deposit | null> {
  await delay();
  return _deposits.find((d) => d.id === id) ?? null;
}

export async function submitDeposit(
  clientId: string,
  data: DepositFormData
): Promise<Deposit> {
  await delay(600);
  const deposit: Deposit = {
    id: genId("dep"),
    clientId,
    fullName: data.fullName,
    bank: data.bank,
    accountNumber: data.accountNumber,
    amount: data.amount,
    depositDate: data.depositDate,
    referenceNumber: data.referenceNumber,
    investmentPeriod: data.investmentPeriod,
    receiptUrl: data.receipt ? URL.createObjectURL(data.receipt) : undefined,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  _deposits = [..._deposits, deposit];

  // Notify all admins and accountants about the new pending deposit
  const staffUsers = _users.filter((u) => u.role === "admin" || u.role === "accountant");
  const now = new Date().toISOString();
  const amountFormatted = data.amount.toLocaleString("fr-BI");
  staffUsers.forEach((staff) => {
    const notification: Notification = {
      id: genId("notif"),
      userId: staff.id,
      title: "New Deposit Submitted",
      message: `${data.fullName} submitted a deposit of ${amountFormatted} BIF (${data.investmentPeriod}) — pending review.`,
      date: now,
      read: false,
      type: "deposit",
    };
    _notifications = [..._notifications, notification];
  });

  return deposit;
}

export async function confirmDeposit(
  id: string,
  verifiedBy: string
): Promise<Deposit> {
  await delay();
  _deposits = _deposits.map((d) =>
    d.id === id
      ? { ...d, status: "confirmed", verifiedBy, verifiedAt: new Date().toISOString() }
      : d
  );
  return _deposits.find((d) => d.id === id)!;
}

export async function rejectDeposit(
  id: string,
  verifiedBy: string,
  rejectionNote: string
): Promise<Deposit> {
  await delay();
  _deposits = _deposits.map((d) =>
    d.id === id
      ? {
          ...d,
          status: "rejected",
          rejectionNote,
          verifiedBy,
          verifiedAt: new Date().toISOString(),
        }
      : d
  );
  return _deposits.find((d) => d.id === id)!;
}

// ─────────────────────────────────────────────
// Withdrawals
// ─────────────────────────────────────────────

export async function getWithdrawals(clientId?: string): Promise<Withdrawal[]> {
  await delay();
  return clientId ? _withdrawals.filter((w) => w.clientId === clientId) : [..._withdrawals];
}

export async function getWithdrawalById(id: string): Promise<Withdrawal | null> {
  await delay();
  return _withdrawals.find((w) => w.id === id) ?? null;
}

export async function submitWithdrawal(
  clientId: string,
  data: WithdrawalFormData
): Promise<Withdrawal> {
  await delay(600);
  const withdrawal: Withdrawal = {
    id: genId("wdr"),
    clientId,
    fullName: data.fullName,
    bankToTransferTo: data.bankToTransferTo,
    accountNumber: data.accountNumber,
    recipientName: data.recipientName,
    amount: data.amount,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
  _withdrawals = [..._withdrawals, withdrawal];

  // Notify all admins and accountants about the new pending withdrawal
  const staffUsers = _users.filter((u) => u.role === "admin" || u.role === "accountant");
  const now = new Date().toISOString();
  const amountFormatted = data.amount.toLocaleString("fr-BI");
  staffUsers.forEach((staff) => {
    const notification: Notification = {
      id: genId("notif"),
      userId: staff.id,
      title: "Withdrawal Request",
      message: `${data.fullName} requested a withdrawal of ${amountFormatted} BIF to ${data.bankToTransferTo} — awaiting confirmation.`,
      date: now,
      read: false,
      type: "withdrawal",
    };
    _notifications = [..._notifications, notification];
  });

  return withdrawal;
}

export async function confirmWithdrawal(id: string): Promise<Withdrawal> {
  await delay();
  _withdrawals = _withdrawals.map((w) =>
    w.id === id ? { ...w, status: "confirmed", confirmedAt: new Date().toISOString() } : w
  );
  return _withdrawals.find((w) => w.id === id)!;
}

export async function rejectWithdrawal(
  id: string,
  rejectionNote: string
): Promise<Withdrawal> {
  await delay();
  _withdrawals = _withdrawals.map((w) =>
    w.id === id
      ? {
          ...w,
          status: "rejected",
          rejectionNote,
          confirmedAt: new Date().toISOString(),
        }
      : w
  );
  return _withdrawals.find((w) => w.id === id)!;
}

// ─────────────────────────────────────────────
// Investments
// ─────────────────────────────────────────────

export async function getInvestments(clientId?: string): Promise<Investment[]> {
  await delay();
  return clientId ? _investments.filter((i) => i.clientId === clientId) : [..._investments];
}

// ─────────────────────────────────────────────
// Interest Rates
// ─────────────────────────────────────────────

export async function getInterestRates(): Promise<InterestRate[]> {
  await delay();
  return [..._rates];
}

export async function upsertInterestRate(
  period: string,
  ratePercentage: number
): Promise<InterestRate> {
  await delay();
  const existing = _rates.find((r) => r.investmentPeriod === period);
  if (existing) {
    _rates = _rates.map((r) =>
      r.investmentPeriod === period
        ? { ...r, ratePercentage, dateUpdated: new Date().toISOString().split("T")[0] }
        : r
    );
    return _rates.find((r) => r.investmentPeriod === period)!;
  }
  const newRate: InterestRate = {
    id: genId("ir"),
    investmentPeriod: period as InterestRate["investmentPeriod"],
    ratePercentage,
    dateUpdated: new Date().toISOString().split("T")[0],
  };
  _rates = [..._rates, newRate];
  return newRate;
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  await delay();
  return _notifications.filter((n) => n.userId === userId).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(200);
  _notifications = _notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await delay(200);
  _notifications = _notifications.map((n) =>
    n.userId === userId ? { ...n, read: true } : n
  );
}

// ─────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  await delay();
  return [..._auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function addAuditLog(entry: Omit<AuditLogEntry, "id">): Promise<void> {
  _auditLogs = [{ ...entry, id: genId("log") }, ..._auditLogs];
}

// ─────────────────────────────────────────────
// Accountant Permissions
// ─────────────────────────────────────────────

export async function getAccountantPermissions(userId: string): Promise<AccountantPermissions | null> {
  await delay();
  return _permissions.find((p) => p.userId === userId) ?? null;
}

export async function updateAccountantPermissions(
  userId: string,
  perms: Partial<AccountantPermissions>
): Promise<AccountantPermissions> {
  await delay();
  _permissions = _permissions.map((p) =>
    p.userId === userId ? { ...p, ...perms } : p
  );
  return _permissions.find((p) => p.userId === userId)!;
}
