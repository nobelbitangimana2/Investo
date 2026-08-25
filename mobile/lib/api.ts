/**
 * Mobile API layer — mirrors frontend/lib/mock-api.ts
 * Uses expo-secure-store for token storage instead of localStorage
 */

import type {
  User, ClientProfile, Deposit, Withdrawal, Investment,
  InterestRate, Notification, AuditLogEntry, AccountantPermissions,
} from '@/types';
import {
  apiGet, apiPost, apiPatch, apiPostForm, apiFetch, unwrapPage,
} from './api-client';
import { setTokens, clearTokens } from './secure-storage';
import { toNumber } from './utils';

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeUser(u: Record<string, unknown>): User {
  return {
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    role: (u.role as string).toLowerCase() as User['role'],
    status: (u.status as string).toLowerCase() as User['status'],
    profilePicture: u.profilePicture as string | undefined,
    phone: u.phone as string | undefined,
    createdAt: u.createdAt as string,
  };
}

function normBank(b: string): string {
  const map: Record<string, string> = {
    BANCOBU: 'Bancobu', BCB: 'BCB', KCB: 'KCB', ECOBANK: 'Ecobank',
    LUMICASH: 'Lumicash', ECOCASH: 'Ecocash',
  };
  return map[b] ?? b;
}

function normPeriod(p: string): string {
  // Map legacy backend enum values to friendly names
  // New free-text periods are returned as-is
  const map: Record<string, string> = {
    WEEKLY: 'Weekly', MONTHLY: 'Monthly', THREE_MONTHS: '3 Months',
    SIX_MONTHS: '6 Months', ONE_YEAR: '1 Year', FIVE_YEARS: '5 Years',
  };
  return map[p] ?? p;
}

function bankToEnum(b: string): string {
  const map: Record<string, string> = {
    Bancobu: 'BANCOBU', BCB: 'BCB', KCB: 'KCB', Ecobank: 'ECOBANK',
    Lumicash: 'LUMICASH', Ecocash: 'ECOCASH',
  };
  return map[b] ?? b;
}

function periodToEnum(p: string): string {
  const map: Record<string, string> = {
    Weekly: 'WEEKLY', Monthly: 'MONTHLY', '3 Months': 'THREE_MONTHS',
    '6 Months': 'SIX_MONTHS', '1 Year': 'ONE_YEAR', '5 Years': 'FIVE_YEARS',
  };
  return map[p] ?? p;
}

function normalizeDeposit(d: Record<string, unknown>): Deposit {
  return {
    ...(d as unknown as Deposit),
    amount: toNumber(d.amount),
    status: (d.status as string).toLowerCase() as Deposit['status'],
    bank: normBank(d.bank as string),
    investmentPeriod: normPeriod(d.investmentPeriod as string),
    submittedAt: (d.submittedAt ?? d.createdAt) as string,
    verifiedBy: (d.verifiedById as string | undefined) ?? undefined,
    verifiedAt: (d.verifiedAt as string | undefined) ?? undefined,
    phoneNumber: ((d.client as Record<string, unknown> | undefined)?.phone as string | undefined) ?? undefined,
  };
}

function normalizeWithdrawal(w: Record<string, unknown>): Withdrawal {
  return {
    ...(w as unknown as Withdrawal),
    amount: toNumber(w.amount),
    status: (w.status as string).toLowerCase() as Withdrawal['status'],
    bankToTransferTo: normBank(w.bankToTransferTo as string),
    phoneNumber: ((w.client as Record<string, unknown> | undefined)?.phone as string | undefined) ?? (w.mobileMoney as Record<string, unknown> | undefined)?.phoneNumber as string | undefined,
  };
}

function normalizeInvestment(i: Record<string, unknown>): Investment {
  const principal = toNumber(i.originalPrincipal ?? i.amount);
  const rate = toNumber(i.interestRate);
  return {
    ...(i as unknown as Investment),
    status: (i.status as string).toLowerCase() as Investment['status'],
    investmentPeriod: normPeriod(i.investmentPeriod as string),
    amount: principal,
    currentPrincipal: toNumber(i.currentPrincipal),
    accruedInterest: toNumber(i.accruedInterest),
    interestRate: rate * 100,
    expectedInterest: principal * rate,
    expectedMaturityValue: principal * (1 + rate),
    confirmationDate: (i.confirmationDate as string) ?? '',
    maturityDate: (i.maturityDate as string) ?? '',
    depositId: (i.depositId as string) ?? '',
    clientId: (i.clientId as string) ?? '',
  };
}

function normalizeNotification(n: Record<string, unknown>): Notification {
  return { ...(n as unknown as Notification), date: (n.createdAt ?? n.date) as string };
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<User> {
  const res = await apiPost<{ user: Record<string, unknown>; accessToken: string; refreshToken: string }>(
    '/auth/login', { email, password },
  );
  await setTokens(res.accessToken, res.refreshToken);
  return normalizeUser(res.user);
}

export async function registerApi(data: {
  firstName: string; middleName?: string; lastName: string; email: string; password: string; phone?: string;
}): Promise<{ message: string }> {
  return apiPost('/auth/register', data);
}

export async function verifyEmailApi(token: string): Promise<{ message: string }> {
  return apiGet(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function resendVerificationApi(email: string): Promise<{ message: string }> {
  return apiPost('/auth/resend-verification', { email });
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try { await apiPost('/auth/logout', { refreshToken }); } finally { await clearTokens(); }
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getMe(): Promise<User> {
  const res = await apiGet<Record<string, unknown>>('/users/me/profile');
  return normalizeUser(res);
}

export async function changePasswordApi(currentPassword: string, newPassword: string) {
  return apiPatch('/users/me/password', { currentPassword, newPassword });
}

export async function uploadAvatarApi(uri: string, fileName: string, mimeType: string): Promise<{ profilePicture: string }> {
  const formData = new FormData();
  formData.append('avatar', { uri, name: fileName, type: mimeType } as unknown as Blob);
  return apiFetch('/users/me/avatar', { method: 'PATCH', body: formData });
}

export async function updateContactApi(data: { phone?: string; address?: string; city?: string; province?: string }) {
  return apiPatch('/users/me/contact', data);
}

export async function getClients(search?: string): Promise<User[]> {
  const q = search ? `&search=${encodeURIComponent(search)}` : '';
  const res = await apiGet<unknown>(`/clients?limit=100${q}`);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeUser);
}

export async function getClientById(id: string) {
  return apiGet<Record<string, unknown>>(`/clients/${id}`);
}

export async function getAccountants(): Promise<User[]> {
  const res = await apiGet<unknown>('/users/accountants');
  return unwrapPage<Record<string, unknown>>(res).map(normalizeUser);
}

export async function createAccountantApi(data: { name: string; email: string; password: string }): Promise<User> {
  const res = await apiPost<Record<string, unknown>>('/users/accountants', data);
  return normalizeUser(res);
}

export async function updateUserStatusApi(id: string, status: 'active' | 'suspended'): Promise<User> {
  const endpoint = status === 'suspended' ? `/users/${id}/status/suspend` : `/users/${id}/status/activate`;
  const res = await apiPatch<Record<string, unknown>>(endpoint);
  return normalizeUser(res);
}

export async function getAccountantPermissions(userId: string): Promise<AccountantPermissions | null> {
  try {
    const res = await apiGet<Record<string, unknown>>(`/users/${userId}`);
    const perms = res.accountantPermission as Record<string, unknown> | undefined;
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
  } catch { return null; }
}

export async function updatePermissionsApi(userId: string, perms: Partial<AccountantPermissions>) {
  return apiPatch(`/users/${userId}/permissions`, {
    viewDeposits: perms.viewDeposits, confirmDeposits: perms.confirmDeposits,
    rejectDeposits: perms.rejectDeposits, viewWithdrawals: perms.viewWithdraws,
    confirmWithdrawals: perms.confirmWithdraws, rejectWithdrawals: perms.rejectWithdraws,
    generateReports: perms.generateReports,
  });
}

// ── Client Profile ─────────────────────────────────────────────────────────

export async function getClientProfile(): Promise<ClientProfile | null> {
  try {
    const res = await apiGet<Record<string, unknown>>('/clients/me');
    return (res.clientProfile as ClientProfile) ?? null;
  } catch { return null; }
}

export async function updateClientProfileApi(data: Partial<ClientProfile>): Promise<ClientProfile> {
  const res = await apiPatch<{ profile: ClientProfile }>('/clients/me', data);
  return res.profile;
}

// ── Partner Banks ──────────────────────────────────────────────────────────

import type { PartnerBank } from '@/types';

export async function getActivePartnerBanks(): Promise<PartnerBank[]> {
  const res = await apiGet<unknown>('/partner-banks/active');
  return unwrapPage<PartnerBank>(res);
}

// ── Deposits ───────────────────────────────────────────────────────────────

export async function getDeposits(isOwn: boolean, clientId?: string): Promise<Deposit[]> {
  const endpoint = isOwn ? '/deposits/me?limit=100'
    : clientId ? `/deposits?clientId=${clientId}&limit=100`
    : '/deposits?limit=100';
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeDeposit);
}

export async function submitDepositApi(data: {
  fullName: string; bank: string; accountNumber: string; amount: number;
  depositDate: string; investmentPeriod: string; referenceNumber: string;
  receiptUri?: string; receiptName?: string; receiptMime?: string;
}): Promise<Deposit> {
  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('bank', bankToEnum(data.bank));
  formData.append('accountNumber', data.accountNumber);
  formData.append('amount', String(data.amount));
  formData.append('depositDate', data.depositDate);
  formData.append('investmentPeriod', periodToEnum(data.investmentPeriod));
  formData.append('referenceNumber', data.referenceNumber);
  if (data.receiptUri) {
    formData.append('receipt', {
      uri: data.receiptUri,
      name: data.receiptName ?? 'receipt.jpg',
      type: data.receiptMime ?? 'image/jpeg',
    } as unknown as Blob);
  }
  const res = await apiPostForm<Record<string, unknown>>('/deposits', formData);
  return normalizeDeposit(res);
}

export async function confirmDepositApi(id: string): Promise<Deposit> {
  const res = await apiPatch<Record<string, unknown>>(`/deposits/${id}/confirm`);
  return normalizeDeposit(res);
}

export async function rejectDepositApi(id: string, rejectionNote: string): Promise<Deposit> {
  const res = await apiPatch<Record<string, unknown>>(`/deposits/${id}/reject`, { rejectionNote });
  return normalizeDeposit(res);
}

// ── Withdrawals ────────────────────────────────────────────────────────────

export async function getWithdrawals(isOwn: boolean, clientId?: string): Promise<Withdrawal[]> {
  const endpoint = isOwn ? '/withdrawals/me?limit=100'
    : clientId ? `/withdrawals?clientId=${clientId}&limit=100`
    : '/withdrawals?limit=100';
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeWithdrawal);
}

export async function submitWithdrawalApi(data: {
  fullName: string;
  bankToTransferTo: string;
  accountNumber?: string;
  phoneNumber?: string;
  recipientName: string;
  amount: number;
}): Promise<Withdrawal> {
  const isMobile = ['Lumicash', 'Ecocash'].includes(data.bankToTransferTo);
  const res = await apiPost<Record<string, unknown>>('/withdrawals', {
    fullName: data.fullName,
    bankToTransferTo: bankToEnum(data.bankToTransferTo),
    ...(isMobile
      ? { phoneNumber: data.phoneNumber }
      : { accountNumber: data.accountNumber }),
    recipientName: data.recipientName,
    amount: data.amount,
  });
  return normalizeWithdrawal(res);
}

export async function confirmWithdrawalApi(id: string): Promise<Withdrawal> {
  const res = await apiPatch<Record<string, unknown>>(`/withdrawals/${id}/confirm`);
  return normalizeWithdrawal(res);
}

export async function rejectWithdrawalApi(id: string, rejectionNote: string): Promise<Withdrawal> {
  const res = await apiPatch<Record<string, unknown>>(`/withdrawals/${id}/reject`, { rejectionNote });
  return normalizeWithdrawal(res);
}

// ── Investments ────────────────────────────────────────────────────────────

export async function getInvestments(isOwn: boolean, clientId?: string): Promise<Investment[]> {
  const endpoint = isOwn ? '/investments/me?limit=100'
    : clientId ? `/investments?clientId=${clientId}&limit=100`
    : '/investments?limit=100';
  const res = await apiGet<unknown>(endpoint);
  return unwrapPage<Record<string, unknown>>(res).map(normalizeInvestment);
}

// ── Interest Rates ─────────────────────────────────────────────────────────

export async function getInterestRates(): Promise<InterestRate[]> {
  const res = await apiGet<unknown>('/interest-rates');
  return unwrapPage<Record<string, unknown>>(res).map((r) => ({
    id: r.id as string,
    // investmentPeriod is now a free-text string — no enum mapping needed
    investmentPeriod: r.investmentPeriod as string,
    ratePercentage: toNumber(r.ratePercentage),
    dateUpdated: (r.updatedAt ?? r.dateUpdated) as string,
  }));
}

export async function upsertInterestRateApi(period: string, ratePercentage: number): Promise<InterestRate> {
  const res = await apiPost<Record<string, unknown>>('/interest-rates', {
    investmentPeriod: periodToEnum(period), ratePercentage,
  });
  return {
    id: res.id as string,
    investmentPeriod: normPeriod(res.investmentPeriod as string),
    ratePercentage: toNumber(res.ratePercentage),
    dateUpdated: (res.updatedAt ?? res.dateUpdated) as string,
  };
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiGet<unknown>('/notifications/me?limit=50');
  return unwrapPage<Record<string, unknown>>(res).map(normalizeNotification);
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiGet<{ count: number }>('/notifications/me/unread-count');
  return res.count;
}

export async function markReadApi(id: string): Promise<void> {
  await apiPatch(`/notifications/${id}/read`);
}

export async function markAllReadApi(): Promise<void> {
  await apiPatch('/notifications/me/read-all');
}

// ── Audit Logs ─────────────────────────────────────────────────────────────

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await apiGet<unknown>('/audit-logs?limit=100');
  return unwrapPage<Record<string, unknown>>(res).map((l) => ({
    id: l.id as string,
    userId: l.userId as string,
    userName: (l.user as Record<string, string> | undefined)?.name ?? '',
    userRole: ((l.user as Record<string, string> | undefined)?.role ?? 'admin').toLowerCase() as AuditLogEntry['userRole'],
    action: l.action as string,
    details: l.details as string,
    timestamp: l.timestamp as string,
    targetId: l.targetId as string | undefined,
    targetType: l.targetType as string | undefined,
  }));
}

// ── Reports ────────────────────────────────────────────────────────────────

export async function getReportsDashboard() {
  return apiGet('/reports/dashboard');
}

export async function getReportsDeposits() {
  return apiGet('/reports/deposits');
}

export async function getReportsInvestments() {
  return apiGet('/reports/investments');
}
