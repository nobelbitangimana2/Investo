import { z } from "zod";

const BANKS = ["Bancobu", "BCB", "KCB", "Ecobank"] as const;
const PERIODS = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const depositSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bank: z.enum(BANKS, { required_error: "Please select a bank" }),
  accountNumber: z.string().min(4, "Account number is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .min(100000, "Minimum deposit is 100,000 BIF"),
  depositDate: z.string().min(1, "Deposit date is required"),
  investmentPeriod: z.enum(PERIODS, { required_error: "Please select a period" }),
  referenceNumber: z.string().min(4, "Reference number is required"),
});

export const withdrawalSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  bankToTransferTo: z.enum(BANKS, { required_error: "Please select a bank" }),
  accountNumber: z.string().min(4, "Account number is required"),
  recipientName: z.string().min(2, "Recipient name is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive")
    .min(1000, "Minimum withdrawal is 1,000 BIF"),
});

export const rejectSchema = z.object({
  rejectionNote: z.string().min(10, "Please provide a reason (at least 10 characters)"),
});

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(8, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  bankName: z.enum(BANKS, { required_error: "Please select a bank" }),
  accountNumber: z.string().min(4, "Account number is required"),
  accountHolderName: z.string().min(2, "Account holder name is required"),
});

export const accountantSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const interestRateSchema = z.object({
  investmentPeriod: z.enum(PERIODS, { required_error: "Period is required" }),
  ratePercentage: z
    .number({ invalid_type_error: "Rate must be a number" })
    .positive("Rate must be positive")
    .max(500, "Rate seems too high"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type DepositFormValues = z.infer<typeof depositSchema>;
export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
export type RejectFormValues = z.infer<typeof rejectSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type AccountantFormValues = z.infer<typeof accountantSchema>;
export type InterestRateFormValues = z.infer<typeof interestRateSchema>;
