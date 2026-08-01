"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { submitDeposit, getInterestRates } from "@/lib/mock-api";
import { depositSchema, type DepositFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, calculateExpectedInterest } from "@/lib/utils";
import type { InterestRate } from "@/types";

const BANKS = ["Bancobu", "BCB", "KCB", "Ecobank"];
const PERIODS = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"];

export default function NewDepositPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [receipt, setReceipt] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      depositDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => { getInterestRates().then(setRates); }, []);

  const watchAmount = watch("amount");
  const watchPeriod = watch("investmentPeriod");
  const selectedRate = rates.find((r) => r.investmentPeriod === watchPeriod)?.ratePercentage ?? 0;
  const expectedInterest = watchAmount && selectedRate
    ? calculateExpectedInterest(Number(watchAmount), selectedRate)
    : 0;

  async function onSubmit(data: DepositFormValues) {
    if (!user) return;
    try {
      await submitDeposit(user.id, { ...data, receipt: receipt ?? undefined });
      toast.success("Deposit submitted successfully! Our team will verify it shortly.");
      router.push("/client/deposits");
    } catch {
      toast.error("Failed to submit deposit. Please try again.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/deposits" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Deposit</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Submit a bank deposit for investment</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          First deposit your money at one of our approved banks, then complete this form and upload your receipt as proof.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader><CardTitle>Deposit Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name"
              placeholder="As it appears on bank documents"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Bank"
                    placeholder="Select bank"
                    options={BANKS.map((b) => ({ value: b, label: b }))}
                    error={errors.bank?.message}
                    {...field}
                  />
                )}
              />
              <Input
                label="Account Number"
                placeholder="e.g. BCB-00123456"
                error={errors.accountNumber?.message}
                {...register("accountNumber")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount (BIF)"
                type="number"
                placeholder="e.g. 1000000"
                error={errors.amount?.message}
                {...register("amount", { valueAsNumber: true })}
              />
              <Input
                label="Deposit Date"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                error={errors.depositDate?.message}
                {...register("depositDate")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="investmentPeriod"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Investment Period"
                    placeholder="Select period"
                    options={PERIODS.map((p) => ({ value: p, label: p }))}
                    error={errors.investmentPeriod?.message}
                    {...field}
                  />
                )}
              />
              <Input
                label="Reference Number"
                placeholder="Bank transaction reference"
                error={errors.referenceNumber?.message}
                {...register("referenceNumber")}
              />
            </div>
          </CardContent>
        </Card>

        {watchAmount > 0 && watchPeriod && (
          <Card className="border-emerald-100 bg-emerald-50">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-emerald-800 mb-3">Investment Preview</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-emerald-600">Principal</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{formatCurrency(Number(watchAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">Rate</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{selectedRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">Expected Interest</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{formatCurrency(expectedInterest)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Receipt Upload</CardTitle></CardHeader>
          <CardContent>
            <FileUpload
              label="Bank Receipt"
              onChange={setReceipt}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Submit Deposit
          </Button>
        </div>
      </form>
    </div>
  );
}
