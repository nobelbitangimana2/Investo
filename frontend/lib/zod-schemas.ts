import { z } from "zod";

// ── Transfer options (banks + mobile money) ───────────────────────────────
export const BANKS = ["Bancobu", "BCB", "KCB", "Ecobank"] as const;
export const TRANSFER_OPTIONS = [
  "Bancobu", "BCB", "KCB", "Ecobank", "Lumicash", "Ecocash",
] as const;
const PERIODS = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"] as const;

// ── Helper: build schemas with translated messages ────────────────────────
// Pass a t() function from useTranslations/useTranslation to get translated errors.
// If no t() is provided, falls back to English strings.

type TFunc = (key: string) => string;

const fallback: TFunc = (key: string) => {
  const defaults: Record<string, string> = {
    "validation.emailInvalid":        "Invalid email address",
    "validation.passwordRequired":    "Password is required",
    "validation.firstNameMin":        "First name must be at least 2 characters",
    "validation.lastNameMin":         "Last name must be at least 2 characters",
    "validation.emailInvalidReg":     "Please enter a valid email address",
    "validation.passwordMin":         "Password must be at least 8 characters",
    "validation.passwordMax":         "Password is too long",
    "validation.confirmPasswordReq":  "Please confirm your password",
    "validation.passwordsNoMatch":    "Passwords do not match",
    "validation.fullNameMin":         "Full name must be at least 2 characters",
    "validation.selectBank":          "Please select a bank",
    "validation.accountNumberReq":    "Account number is required",
    "validation.amountNumber":        "Amount must be a number",
    "validation.amountPositive":      "Amount must be positive",
    "validation.depositMin":          "Minimum deposit is 100,000 BIF",
    "validation.depositDateReq":      "Deposit date is required",
    "validation.selectPeriod":        "Please select a period",
    "validation.referenceReq":        "Reference number is required",
    "validation.fullNameReq":         "Full name is required",
    "validation.recipientNameReq":    "Recipient name is required",
    "validation.withdrawalMin":       "Minimum withdrawal is 50,000 BIF",
    "validation.rejectionNoteMin":    "Please provide a reason (at least 10 characters)",
    "validation.firstNameReq":        "First name is required",
    "validation.lastNameReq":         "Last name is required",
    "validation.phoneMin":            "Phone number is required",
    "validation.addressMin":          "Address is required",
    "validation.cityMin":             "City is required",
    "validation.provinceMin":         "Province is required",
    "validation.bankNameReq":         "Please select a bank",
    "validation.accountHolderReq":    "Account holder name is required",
    "validation.nameReq":             "Name is required",
    "validation.emailInvalidAcc":     "Invalid email",
    "validation.passwordMinAcc":      "Password must be at least 8 characters",
    "validation.periodReq":           "Period is required",
    "validation.periodFormat":        "Must be a number followed by 'month(s)' or 'year(s)' — e.g. '3 Months' or '1 Year'",
    "validation.rateNumber":          "Rate must be a number",
    "validation.ratePositive":        "Rate must be positive",
    "validation.rateMax":             "Rate seems too high",
  };
  return defaults[key] ?? key;
};

// ── Static schemas (used where t() is not available, e.g. server-side) ────

export const loginSchema = z.object({
  email:    z.string().email(fallback("validation.emailInvalid")),
  password: z.string().min(1, fallback("validation.passwordRequired")),
});

export const registerSchema = z
  .object({
    firstName:       z.string().min(2, fallback("validation.firstNameMin")).max(50).transform((v) => v.trim()),
    middleName:      z.string().max(50).optional().transform((v) => v?.trim() || undefined),
    lastName:        z.string().min(2, fallback("validation.lastNameMin")).max(50).transform((v) => v.trim()),
    email:           z.string().email(fallback("validation.emailInvalidReg")).transform((v) => v.toLowerCase().trim()),
    password:        z.string().min(8, fallback("validation.passwordMin")).max(128, fallback("validation.passwordMax")),
    confirmPassword: z.string().min(1, fallback("validation.confirmPasswordReq")),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: fallback("validation.passwordsNoMatch"),
    path: ["confirmPassword"],
  });

export const depositSchema = z.object({
  fullName:         z.string().min(2, fallback("validation.fullNameMin")),
  bank:             z.string().min(1, fallback("validation.selectBank")),
  accountNumber:    z.string().min(4, fallback("validation.accountNumberReq")),
  amount:           z.number({ invalid_type_error: fallback("validation.amountNumber") })
                     .positive(fallback("validation.amountPositive"))
                     .min(100000, fallback("validation.depositMin")),
  depositDate:      z.string().min(1, fallback("validation.depositDateReq")),
  investmentPeriod: z.string().min(1, fallback("validation.selectPeriod")),
  referenceNumber:  z.string().min(4, fallback("validation.referenceReq")),
});

export const withdrawalSchema = z.object({
  fullName:         z.string().min(2, fallback("validation.fullNameReq")),
  bankToTransferTo: z.string().min(1, fallback("validation.selectBank")),
  // accountNumber used for bank transfers; phoneNumber used for mobile money
  accountNumber:    z.string().optional(),
  phoneNumber:      z.string().optional(),
  recipientName:    z.string().min(2, fallback("validation.recipientNameReq")),
  amount:           z.number({ invalid_type_error: fallback("validation.amountNumber") })
                     .positive(fallback("validation.amountPositive"))
                     .min(50000, fallback("validation.withdrawalMin")),
}).superRefine((data, ctx) => {
  const isMobile = ["Lumicash", "Ecocash"].includes(data.bankToTransferTo);
  if (isMobile) {
    if (!data.phoneNumber || data.phoneNumber.trim().length < 8) {
      ctx.addIssue({ code: "custom", path: ["phoneNumber"], message: fallback("validation.accountNumberReq") });
    }
  } else {
    if (!data.accountNumber || data.accountNumber.trim().length < 4) {
      ctx.addIssue({ code: "custom", path: ["accountNumber"], message: fallback("validation.accountNumberReq") });
    }
  }
});

export const rejectSchema = z.object({
  rejectionNote: z.string().min(10, fallback("validation.rejectionNoteMin")),
});

export const profileSchema = z.object({
  firstName:        z.string().min(1, fallback("validation.firstNameReq")),
  lastName:         z.string().min(1, fallback("validation.lastNameReq")),
  phone:            z.string().min(8, fallback("validation.phoneMin")),
  address:          z.string().min(5, fallback("validation.addressMin")),
  city:             z.string().min(2, fallback("validation.cityMin")),
  province:         z.string().min(2, fallback("validation.provinceMin")),
  bankName:         z.enum(BANKS, { required_error: fallback("validation.bankNameReq") }),
  accountNumber:    z.string().min(4, fallback("validation.accountNumberReq")),
  accountHolderName: z.string().min(2, fallback("validation.accountHolderReq")),
});

export const accountantSchema = z.object({
  name:     z.string().min(2, fallback("validation.nameReq")),
  email:    z.string().email(fallback("validation.emailInvalidAcc")),
  password: z.string().min(8, fallback("validation.passwordMinAcc")),
});

export const interestRateSchema = z.object({
  // Accepts: "1 Month", "2 Months", "6 months", "1 Year", "3 Years", "10 years" (case-insensitive)
  investmentPeriod: z.string()
    .min(1, fallback("validation.periodReq"))
    .regex(
      /^\d+\s+(month|months|year|years)$/i,
      fallback("validation.periodFormat"),
    ),
  ratePercentage:   z.number({ invalid_type_error: fallback("validation.rateNumber") })
                     .positive(fallback("validation.ratePositive"))
                     .max(500, fallback("validation.rateMax")),
});

// ── Factory: create schemas with translated messages ──────────────────────
// Usage: const schemas = createSchemas(t);  const validated = schemas.withdrawal.parse(data);
export function createSchemas(t: TFunc) {
  const tr = (key: string) => { try { return t(key); } catch { return fallback(key); } };
  return {
    login: z.object({
      email:    z.string().email(tr("validation.emailInvalid")),
      password: z.string().min(1, tr("validation.passwordRequired")),
    }),
    withdrawal: z.object({
      fullName:         z.string().min(2, tr("validation.fullNameReq")),
      bankToTransferTo: z.string().min(1, tr("validation.selectBank")),
      accountNumber:    z.string().min(4, tr("validation.accountNumberReq")),
      recipientName:    z.string().min(2, tr("validation.recipientNameReq")),
      amount:           z.number({ invalid_type_error: tr("validation.amountNumber") })
                         .positive(tr("validation.amountPositive"))
                         .min(50000, tr("validation.withdrawalMin")),
    }),
    deposit: z.object({
      fullName:         z.string().min(2, tr("validation.fullNameMin")),
      bank:             z.string().min(1, tr("validation.selectBank")),
      accountNumber:    z.string().min(4, tr("validation.accountNumberReq")),
      amount:           z.number({ invalid_type_error: tr("validation.amountNumber") })
                         .positive(tr("validation.amountPositive"))
                         .min(100000, tr("validation.depositMin")),
      depositDate:      z.string().min(1, tr("validation.depositDateReq")),
      investmentPeriod: z.string().min(1, tr("validation.selectPeriod")),
      referenceNumber:  z.string().min(4, tr("validation.referenceReq")),
    }),
  };
}

export type LoginFormValues        = z.infer<typeof loginSchema>;
export type RegisterFormValues     = z.infer<typeof registerSchema>;
export type DepositFormValues      = z.infer<typeof depositSchema>;
export type WithdrawalFormValues   = z.infer<typeof withdrawalSchema>;
export type RejectFormValues       = z.infer<typeof rejectSchema>;
export type ProfileFormValues      = z.infer<typeof profileSchema>;
export type AccountantFormValues   = z.infer<typeof accountantSchema>;
export type InterestRateFormValues = z.infer<typeof interestRateSchema>;
