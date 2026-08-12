import { z } from 'zod';

const BANKS = ['Bancobu', 'BCB', 'KCB', 'Ecobank'] as const;
const PERIODS = ['Weekly', 'Monthly', '3 Months', '6 Months', '1 Year', '5 Years'] as const;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).transform((v) => v.trim()),
    middleName: z.string().max(50).optional().transform((v) => v?.trim() || undefined),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).transform((v) => v.trim()),
    email: z.string().email('Please enter a valid email address').transform((v) => v.toLowerCase().trim()),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const depositSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  bank: z.enum(BANKS, { required_error: 'Please select a bank' }),
  accountNumber: z.string().min(4, 'Account number is required'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive().min(100000, 'Minimum deposit is 100,000 BIF'),
  depositDate: z.string().min(1, 'Deposit date is required'),
  investmentPeriod: z.enum(PERIODS, { required_error: 'Please select a period' }),
  referenceNumber: z.string().min(4, 'Reference number is required'),
});

export const withdrawalSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  bankToTransferTo: z.enum(BANKS, { required_error: 'Please select a bank' }),
  accountNumber: z.string().min(4, 'Account number is required'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive().min(1000, 'Minimum withdrawal is 1,000 BIF'),
});

export const rejectSchema = z.object({
  rejectionNote: z.string().min(10, 'Please provide a reason (at least 10 characters)'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type DepositFormValues = z.infer<typeof depositSchema>;
export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
export type RejectFormValues = z.infer<typeof rejectSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
