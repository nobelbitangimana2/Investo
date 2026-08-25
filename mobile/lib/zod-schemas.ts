import { z } from 'zod';

// Mobile money providers — these show a phone number field instead of account number
export const MOBILE_MONEY = ['Lumicash', 'Ecocash'] as const;

// i18next t() type
type TFunc = (key: string) => string;

// Fallback English messages
const fb: TFunc = (key) => {
  const d: Record<string, string> = {
    'validation.emailInvalid':       'Invalid email address',
    'validation.passwordRequired':   'Password is required',
    'validation.firstNameMin':       'First name must be at least 2 characters',
    'validation.lastNameMin':        'Last name must be at least 2 characters',
    'validation.emailInvalidReg':    'Please enter a valid email address',
    'validation.passwordMin':        'Password must be at least 8 characters',
    'validation.passwordMax':        'Password is too long',
    'validation.confirmPasswordReq': 'Please confirm your password',
    'validation.passwordsNoMatch':   'Passwords do not match',
    'validation.fullNameMin':        'Full name must be at least 2 characters',
    'validation.selectBank':         'Please select a bank',
    'validation.accountNumberReq':   'Account number is required',
    'validation.phoneNumberReq':     'Phone number is required',
    'validation.amountNumber':       'Amount must be a number',
    'validation.amountPositive':     'Amount must be positive',
    'validation.depositMin':         'Minimum deposit is 100,000 BIF',
    'validation.depositDateReq':     'Deposit date is required',
    'validation.selectPeriod':       'Please select a period',
    'validation.referenceReq':       'Reference number is required',
    'validation.fullNameReq':        'Full name is required',
    'validation.recipientNameReq':   'Recipient name is required',
    'validation.withdrawalMin':      'Minimum withdrawal is 50,000 BIF',
    'validation.rejectionNoteMin':   'Please provide a reason (at least 10 characters)',
    'validation.firstNameReq':       'First name is required',
    'validation.lastNameReq':        'Last name is required',
    'validation.phoneMin':           'Phone number is required',
    'validation.addressMin':         'Address is required',
    'validation.cityMin':            'City is required',
    'validation.provinceMin':        'Province is required',
    'validation.nameReq':            'Name is required',
    'validation.passwordMinAcc':     'Password must be at least 8 characters',
    'validation.periodReq':          'Period is required',
    'validation.rateNumber':         'Rate must be a number',
    'validation.ratePositive':       'Rate must be positive',
    'validation.rateMax':            'Rate seems too high',
    'validation.currentPwReq':       'Current password is required',
    'validation.newPwMin':           'New password must be at least 8 characters',
    'validation.confirmNewPwReq':    'Please confirm your new password',
  };
  return d[key] ?? key;
};

export const loginSchema = z.object({
  email:    z.string().email(fb('validation.emailInvalid')),
  password: z.string().min(1, fb('validation.passwordRequired')),
});

export const registerSchema = z
  .object({
    firstName:       z.string().min(2, fb('validation.firstNameMin')).max(50).transform((v) => v.trim()),
    middleName:      z.string().max(50).optional().transform((v) => v?.trim() || undefined),
    lastName:        z.string().min(2, fb('validation.lastNameMin')).max(50).transform((v) => v.trim()),
    email:           z.string().email(fb('validation.emailInvalidReg')).transform((v) => v.toLowerCase().trim()),
    phone:           z.string().min(8, fb('validation.phoneMin')).max(30).transform((v) => v.trim()),
    password:        z.string().min(8, fb('validation.passwordMin')).max(128, fb('validation.passwordMax')),
    confirmPassword: z.string().min(1, fb('validation.confirmPasswordReq')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: fb('validation.passwordsNoMatch'),
    path: ['confirmPassword'],
  });

// Deposit — bank and investmentPeriod are now free strings (come from partner banks API)
export const depositSchema = z.object({
  fullName:         z.string().min(2, fb('validation.fullNameMin')),
  bank:             z.string().min(1, fb('validation.selectBank')),
  accountNumber:    z.string().min(4, fb('validation.accountNumberReq')),
  amount:           z.number({ invalid_type_error: fb('validation.amountNumber') })
                     .positive(fb('validation.amountPositive'))
                     .min(100000, fb('validation.depositMin')),
  depositDate:      z.string().min(1, fb('validation.depositDateReq')),
  investmentPeriod: z.string().min(1, fb('validation.selectPeriod')),
  referenceNumber:  z.string().min(4, fb('validation.referenceReq')),
});

// Withdrawal — bankToTransferTo is a free string; phoneNumber used for mobile money
export const withdrawalSchema = z.object({
  fullName:         z.string().min(2, fb('validation.fullNameReq')),
  bankToTransferTo: z.string().min(1, fb('validation.selectBank')),
  accountNumber:    z.string().optional(),
  phoneNumber:      z.string().optional(),
  recipientName:    z.string().min(2, fb('validation.recipientNameReq')),
  amount:           z.number({ invalid_type_error: fb('validation.amountNumber') })
                     .positive(fb('validation.amountPositive'))
                     .min(50000, fb('validation.withdrawalMin')),
}).superRefine((data, ctx) => {
  const isMobile = (MOBILE_MONEY as readonly string[]).includes(data.bankToTransferTo);
  if (isMobile) {
    if (!data.phoneNumber || data.phoneNumber.trim().length < 8) {
      ctx.addIssue({ code: 'custom', path: ['phoneNumber'], message: fb('validation.phoneNumberReq') });
    }
  } else {
    if (!data.accountNumber || data.accountNumber.trim().length < 4) {
      ctx.addIssue({ code: 'custom', path: ['accountNumber'], message: fb('validation.accountNumberReq') });
    }
  }
});

export const rejectSchema = z.object({
  rejectionNote: z.string().min(10, fb('validation.rejectionNoteMin')),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, fb('validation.currentPwReq')),
    newPassword:     z.string().min(8, fb('validation.newPwMin')),
    confirmPassword: z.string().min(1, fb('validation.confirmNewPwReq')),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: fb('validation.passwordsNoMatch'),
    path: ['confirmPassword'],
  });

export type LoginFormValues          = z.infer<typeof loginSchema>;
export type RegisterFormValues       = z.infer<typeof registerSchema>;
export type DepositFormValues        = z.infer<typeof depositSchema>;
export type WithdrawalFormValues     = z.infer<typeof withdrawalSchema>;
export type RejectFormValues         = z.infer<typeof rejectSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
