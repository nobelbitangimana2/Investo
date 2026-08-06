/**
 * API layer — all functions call the real NestJS backend.
 * Signatures are identical to the old mock layer so no page/component changes needed.
 *
 * Backend base URL is set via NEXT_PUBLIC_API_URL in .env.local
 * (defaults to http://localhost:3001/api in development).
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
  apiGet,
  apiPost,
  apiPatch,
  apiPostForm,
  apiPatchForm,
  setTokens,
  clearTokens,
} from "./api-client";

// ── Helpers to map backend enum values → frontend string literals ─────────
// The backend uses uppercase enums (CONFIRMED, BCB, ONE_YEAR…)
// The frontend types use lowercase/friendly strings (confirmed, BCB, 1 Year…)

function normalizeUser(u: Record<string, unknown>): User {
  return {
    ...(u as User),
    role: (u.role as string).toLowerCase() as User["role"],
    status: (u.status as string).toLowerCase() as User["status"],
  };
}

function normalizeDeposit(d: Record<string, unknown>): Deposit {
  return {
    ...(d as Deposit),
    amount: toNumber(d.amount),
    status: (d.status as string).toLowerCase() as Deposit["status"],
    bank: normBank(d.bank as string),
    investmentPeriod: normPeriod(d.investmentPeriod as string),
    submittedAt: (d.submittedAt ?? d.createdAt) as string,
    verifiedBy: (d.verifiedById as string | undefined) ?? undefined,
    verifiedAt: (d.verifiedAt as string | undefined) ?? undefined,
  };
}

function normalizeWithdrawal(w: Record<string, unknown>): Withdrawal {
  return {
    ...(w as Withdrawal),
    amount: toNumber(w.amount),
    status: (w.status as string).toLowerCase() as Withdrawal["status"],
    bankToTransferTo: normBank(w.bankToTransferTo as string),
  };
}

function normalizeInvestment(i: Record<string, unknown>): Investment {
  const originalPrincipal = toNumber(i.originalPrincipal ?? i.amount);
  const interestRate = toNumber(i.interestRate);
  return {
    ...(i as Investment),
    status: (i.status as string).toLowerCase() as Investment["status"],
    investmentPeriod: normPeriod(i.investmentPeriod as string),
    amount: originalPrincipal,
    currentPrincipal: toNumber(i.currentPrincipal),
    accruedInterest: toNumber(i.accruedInterest),
    interestRate: interestRate * 100,
    expectedInterest: originalPrincipal * interestRate,
    expectedMaturityValue: originalPrincipal * (1 + interestRate),
    confirmationDate: (i.confirmationDate as string) ?? "",
    maturityDate: (i.maturityDate as string) ?? "",
    depositId: (i.depositId as string) ?? "",
    clientId: (i.clientId as string) ?? "",
  };
}

function normalizeNotification(n: Record<string, unknown>): Notification {
  return {
    ...(n as Notification),
    date: (n.createdAt ?? n.date) as string,
  };
}

// Extract number from Prisma Decimal object or plain number/string
// Prisma Decimal serializes as: { s: 1, e: 6, d: [1500000] }
function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  if (typeof val === "object") {
    const dec = val as { d?: number[]; s?: number; e?: number };
    if (Array.isArray(dec.d) && dec.d.length > 0) {
      // Reconstruct: s * d[0] * 10^(e - (d[0].toString().length - 1))
      // Simpler: just use the toString() method if available
      if (typeof (val as Record<string, unknown>).toString === "function") {
        const str = (val as { toString: () => string }).toString();
        const parsed = parseFloat(str);
        if (!isNaN(parsed)) return parsed;
      }
      // Fallback: d[0] contains the significant digits
      const significant = dec.d[0];
      const exponent = dec.e ?? 0;
      const digits = significant.toString().length - 1;
      return (dec.s ?? 1) * significant * Math.pow(10, exponent - digits);
    }
  }
  return Number(val);
}
function normBank(b: string): Deposit["bank"] {
  const map: Record<string, Deposit["bank"]> = {
    BANCOBU: "Bancobu",
    BCB: "BCB",
    KCB: "KCB",
    ECOBANK: "Ecobank",
  };
  return map[b] ?? (b as Deposit["bank"]);
}

// InvestmentPeriod enum mapping
function normPeriod(p: string): Deposit["investmentPeriod"] {
  const map: Record<string, Deposit["investmentPeriod"]> = {
    WEEKLY: "Weekly",
    MONTHLY: "Monthly",
    THREE_MONTHS: "3 Months",
    SIX_MONTHS: "6 Months",
    ONE_YEAR: "1 Year",
    FIVE_YEARS: "5 Years",
  };
  return map[p] ?? (p as Deposit["investmentPeriod"]);
}

// Bank name → backend enum
function bankToEnum(b: string): string {
  const map: Record<string, string> = {
    Bancobu: "BANCOBU",
    BCB: "BCB",
    KCB: "KCB",
    Ecobank: "ECOBANK",
  };
  return map[b] ?? b;
}

// Period → backend enum
function periodToEnum(p: string): string {
  const map: Record<string, string> = {
    Weekly: "WEEKLY",
    Monthly: "MONTHLY",
    "3 Months": "THREE_MONTHS",
    "6 Months": "SIX_MONTHS",
    "1 Year": "ONE_YEAR",
    "5 Years": "FIVE_YEARS",
  };
  return map[p] ?? p;
}

// Unwrap paginated response
// Backend returns: { success: true, data: { data: [...], meta: {...} } }
// api-client already strips the outer { success, data } envelope
// so here we receive: { data: [...], meta: {...} }
function unwrapPage<T>(res: unknown): T[] {
  if (res && typeof res === "object") {
    // paginated: { data: [...], meta: {...} }
    if ("data" in res && Array.isArray((res as Record<string, unknown>).data)) {
      return (res as { data: T[] }).data;
    }
    // already an array
    if (Array.isArray(res)) return res as T[];
  }
  return res as T[];
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export async function mockLogin(
  email: string,
  password: string,
): Promise<User | null> {
  try {
    const res = await apiPost<{
      user: Record<string, unknown>;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", { email, password });

    setTokens(res.accessToken, res.refreshToken);
    return normalizeUser(res.user);
  } catch {
    return null;
  }
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await apiPost("/auth/logout", { refreshToken });
  } finally {
    clearTokens();
  }
}

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const res = await apiGet<unknown>("/users");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeUser);
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/users/${id}`);
    return normalizeUser(res);
  } catch {
    return null;
  }
}

export async function getClients(): Promise<User[]> {
  const res = await apiGet<unknown>("/clients?limit=100");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeUser);
}

export async function getAccountants(): Promise<User[]> {
  const res = await apiGet<unknown>("/users/accountants");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeUser);
}

export async function createAccountant(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await apiPost<Record<string, unknown>>("/users/accountants", data);
  return normalizeUser(res);
}

export async function updateUserStatus(
  id: string,
  status: "active" | "suspended",
): Promise<User> {
  const endpoint =
    status === "suspended"
      ? `/users/${id}/status/suspend`
      : `/users/${id}/status/activate`;
  const res = await apiPatch<Record<string, unknown>>(endpoint);
  return normalizeUser(res);
}

// ─────────────────────────────────────────────
// Client Profiles
// ─────────────────────────────────────────────

export async function getClientProfile(
  userId: string,
): Promise<ClientProfile | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/clients/me`);
    const profile = res.clientProfile as ClientProfile | undefined;
    return profile ?? null;
  } catch {
    return null;
  }
}

export async function updateClientProfile(
  _userId: string,
  data: Partial<ClientProfile>,
): Promise<ClientProfile> {
  const res = await apiPatch<{ profile: ClientProfile }>("/clients/me", data);
  return res.profile;
}

// ─────────────────────────────────────────────
// Deposits
// ─────────────────────────────────────────────

export async function getDeposits(clientId?: string, isOwnData = false): Promise<Deposit[]> {
  let endpoint: string;
  if (!clientId) {
    // Admin/accountant fetching all deposits
    endpoint = "/deposits?limit=100";
  } else if (isOwnData) {
    // Client fetching their own deposits
    endpoint = "/deposits/me?limit=100";
  } else {
    // Admin/accountant fetching a specific client's deposits
    endpoint = `/deposits?clientId=${clientId}&limit=100`;
  }
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeDeposit);
}

export async function getMyDeposits(): Promise<Deposit[]> {
  const res = await apiGet<unknown>("/deposits/me?limit=100");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeDeposit);
}

export async function getDepositById(id: string): Promise<Deposit | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/deposits/${id}`);
    return normalizeDeposit(res);
  } catch {
    return null;
  }
}

export async function submitDeposit(
  _clientId: string,
  data: DepositFormData,
): Promise<Deposit> {
  const formData = new FormData();
  formData.append("fullName", data.fullName);
  formData.append("bank", bankToEnum(data.bank));
  formData.append("accountNumber", data.accountNumber);
  formData.append("amount", String(data.amount));
  formData.append("depositDate", data.depositDate);
  formData.append("investmentPeriod", periodToEnum(data.investmentPeriod));
  formData.append("referenceNumber", data.referenceNumber);
  if (data.receipt) {
    formData.append("receipt", data.receipt);
  }
  const res = await apiPostForm<Record<string, unknown>>("/deposits", formData);
  return normalizeDeposit(res);
}

export async function confirmDeposit(
  id: string,
  _verifiedBy: string,
): Promise<Deposit> {
  const res = await apiPatch<Record<string, unknown>>(`/deposits/${id}/confirm`);
  // Backend automatically creates a notification for the client
  return normalizeDeposit(res);
}

export async function rejectDeposit(
  id: string,
  _verifiedBy: string,
  rejectionNote: string,
): Promise<Deposit> {
  const res = await apiPatch<Record<string, unknown>>(`/deposits/${id}/reject`, {
    rejectionNote,
  });
  // Backend automatically creates a notification for the client
  return normalizeDeposit(res);
}

// ─────────────────────────────────────────────
// Withdrawals
// ─────────────────────────────────────────────

export async function getWithdrawals(clientId?: string, isOwnData = false): Promise<Withdrawal[]> {
  let endpoint: string;
  if (!clientId) {
    endpoint = "/withdrawals?limit=100";
  } else if (isOwnData) {
    endpoint = "/withdrawals/me?limit=100";
  } else {
    endpoint = `/withdrawals?clientId=${clientId}&limit=100`;
  }
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeWithdrawal);
}

export async function getMyWithdrawals(): Promise<Withdrawal[]> {
  const res = await apiGet<unknown>("/withdrawals/me?limit=100");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeWithdrawal);
}

export async function getWithdrawalById(id: string): Promise<Withdrawal | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/withdrawals/${id}`);
    return normalizeWithdrawal(res);
  } catch {
    return null;
  }
}

export async function submitWithdrawal(
  _clientId: string,
  data: WithdrawalFormData,
): Promise<Withdrawal> {
  const res = await apiPost<Record<string, unknown>>("/withdrawals", {
    fullName: data.fullName,
    bankToTransferTo: bankToEnum(data.bankToTransferTo),
    accountNumber: data.accountNumber,
    recipientName: data.recipientName,
    amount: data.amount,
  });
  return normalizeWithdrawal(res);
}

export async function confirmWithdrawal(id: string): Promise<Withdrawal> {
  const res = await apiPatch<Record<string, unknown>>(
    `/withdrawals/${id}/confirm`,
  );
  return normalizeWithdrawal(res);
}

export async function rejectWithdrawal(
  id: string,
  rejectionNote: string,
): Promise<Withdrawal> {
  const res = await apiPatch<Record<string, unknown>>(
    `/withdrawals/${id}/reject`,
    { rejectionNote },
  );
  return normalizeWithdrawal(res);
}

// ─────────────────────────────────────────────
// Investments
// ─────────────────────────────────────────────

export async function getInvestments(clientId?: string, isOwnData = false): Promise<Investment[]> {
  let endpoint: string;
  if (!clientId) {
    endpoint = "/investments?limit=100";
  } else if (isOwnData) {
    endpoint = "/investments/me?limit=100";
  } else {
    endpoint = `/investments?clientId=${clientId}&limit=100`;
  }
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeInvestment);
}

export async function getMyInvestments(): Promise<Investment[]> {
  const res = await apiGet<unknown>("/investments/me?limit=100");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeInvestment);
}

// ─────────────────────────────────────────────
// Interest Rates
// ─────────────────────────────────────────────

export async function getInterestRates(): Promise<InterestRate[]> {
  const res = await apiGet<unknown>("/interest-rates");
  const rates = unwrapPage<Record<string, unknown>>(res);
  return rates.map((r) => ({
    id: r.id as string,
    investmentPeriod: normPeriod(r.investmentPeriod as string),
    ratePercentage: toNumber(r.ratePercentage),
    dateUpdated: (r.updatedAt ?? r.dateUpdated) as string,
  }));
}

export async function upsertInterestRate(
  period: string,
  ratePercentage: number,
): Promise<InterestRate> {
  const res = await apiPost<Record<string, unknown>>("/interest-rates", {
    investmentPeriod: periodToEnum(period),
    ratePercentage,
  });
  return {
    id: res.id as string,
    investmentPeriod: normPeriod(res.investmentPeriod as string),
    ratePercentage: toNumber(res.ratePercentage),
    dateUpdated: (res.updatedAt ?? res.dateUpdated) as string,
  };
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export async function getNotifications(
  _userId: string,
): Promise<Notification[]> {
  const res = await apiGet<unknown>("/notifications/me?limit=50");
  return unwrapPage<Record<string, unknown>>(res).map(normalizeNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiPatch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(_userId: string): Promise<void> {
  await apiPatch("/notifications/me/read-all");
}

// ─────────────────────────────────────────────
// Audit Logs
// ─────────────────────────────────────────────

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await apiGet<unknown>("/audit-logs?limit=100");
  return unwrapPage<Record<string, unknown>>(res).map((l) => ({
    id: l.id as string,
    userId: l.userId as string,
    userName: (l.user as Record<string, string> | undefined)?.name ?? "",
    userRole: (
      (l.user as Record<string, string> | undefined)?.role ?? "admin"
    ).toLowerCase() as AuditLogEntry["userRole"],
    action: l.action as string,
    details: l.details as string,
    timestamp: l.timestamp as string,
    targetId: l.targetId as string | undefined,
    targetType: l.targetType as AuditLogEntry["targetType"] | undefined,
  }));
}

export async function addAuditLog(
  _entry: Omit<AuditLogEntry, "id">,
): Promise<void> {
  // Audit logs are written server-side automatically — no client call needed
}

// ─────────────────────────────────────────────
// Accountant Permissions
// ─────────────────────────────────────────────

export async function getAccountantPermissions(
  userId: string,
): Promise<AccountantPermissions | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/users/${userId}`);
    const perms = res.accountantPermission as
      | Record<string, unknown>
      | undefined;
    if (!perms) return null;
    return {
      userId: perms.userId as string,
      viewDeposits: perms.viewDeposits as boolean,
      viewWithdraws: perms.viewWithdrawals as boolean,
      confirmDeposits: perms.confirmDeposits as boolean,
      rejectDeposits: perms.rejectDeposits as boolean,
      confirmWithdraws: perms.confirmWithdrawals as boolean,
      rejectWithdraws: perms.rejectWithdrawals as boolean,
      generateReports: perms.generateReports as boolean,
    };
  } catch {
    return null;
  }
}

export async function updateAccountantPermissions(
  userId: string,
  perms: Partial<AccountantPermissions>,
): Promise<AccountantPermissions> {
  const body = {
    viewDeposits: perms.viewDeposits,
    confirmDeposits: perms.confirmDeposits,
    rejectDeposits: perms.rejectDeposits,
    viewWithdrawals: perms.viewWithdraws,
    confirmWithdrawals: perms.confirmWithdraws,
    rejectWithdrawals: perms.rejectWithdraws,
    generateReports: perms.generateReports,
  };
  const res = await apiPatch<Record<string, unknown>>(
    `/users/${userId}/permissions`,
    body,
  );
  return {
    userId: res.userId as string,
    viewDeposits: res.viewDeposits as boolean,
    viewWithdraws: res.viewWithdrawals as boolean,
    confirmDeposits: res.confirmDeposits as boolean,
    rejectDeposits: res.rejectDeposits as boolean,
    confirmWithdraws: res.confirmWithdrawals as boolean,
    rejectWithdraws: res.rejectWithdrawals as boolean,
    generateReports: res.generateReports as boolean,
  };
}
