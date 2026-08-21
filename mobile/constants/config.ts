import Constants from 'expo-constants';

export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'https://investobacken.onrender.com/api';

// Fallback bank list used only when the partner-banks API hasn't responded yet
export const FALLBACK_BANKS = ['Bancobu', 'BCB', 'KCB', 'Ecobank', 'Lumicash', 'Ecocash'] as const;

export const MOBILE_MONEY_BANKS = ['Lumicash', 'Ecocash'] as const;

export const COLORS = {
  navy: '#0f2167',
  navyLight: '#1a3080',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  pending: '#f59e0b',
  confirmed: '#10b981',
  rejected: '#ef4444',
  active: '#3b82f6',
  matured: '#8b5cf6',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.pending,
  confirmed: COLORS.confirmed,
  rejected: COLORS.rejected,
  active: COLORS.active,
  matured: COLORS.matured,
  suspended: COLORS.red,
};
