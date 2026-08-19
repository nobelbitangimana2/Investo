"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { submitDeposit, getInterestRates, getActivePartnerBanks } from "@/lib/mock-api";
import { depositSchema, type DepositFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, calculateExpectedInterest } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { InterestRate, PartnerBank } from "@/types";

const PERIODS = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"];

export default function NewDepositPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("client.deposits.form");
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [partnerBanks, setPartnerBanks] = useState<PartnerBank[]>([]);
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

  useEffect(() => {
    getInterestRates().then(setRates);
    getActivePartnerBanks().then(setPartnerBanks);
  }, []);

  const watchAmount = watch("amount");
  const watchPeriod = watch("investmentPeriod");
  const watchBank = watch("bank");
  const selectedRate = rates.find((r) => r.investmentPeriod === watchPeriod)?.ratePercentage ?? 0;
  const expectedInterest = watchAmount && selectedRate
    ? calculateExpectedInterest(Number(watchAmount), selectedRate)
    : 0;
  // Find the selected partner bank to show its transfer details
  const selectedPartnerBank = partnerBanks.find((b) => b.name === watchBank) ?? null;

  async function onSubmit(data: DepositFormValues) {
    if (!user) return;
    try {
      await submitDeposit(user.id, { ...data, receipt: receipt ?? undefined });
      toast.success(t("successMessage"));
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
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          First deposit your money at one of our approved banks, then complete this form and upload your receipt as proof.
        </p>
      </div>

      {/* Bank transfer details autofill card */}
      {selectedPartnerBank && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-4 py-4">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3">
            Transfer to this account
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-emerald-600 dark:text-emerald-500 text-xs">Bank</p>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">{selectedPartnerBank.name}</p>
            </div>
            <div>
              <p className="text-emerald-600 dark:text-emerald-500 text-xs">Account Name</p>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">{selectedPartnerBank.accountName}</p>
            </div>
            <div className="col-span-2">
              <p className="text-emerald-600 dark:text-emerald-500 text-xs">Account Number</p>
              <p className="font-bold text-emerald-900 dark:text-emerald-100 font-mono tracking-widest text-base">
                {selectedPartnerBank.accountNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader><CardTitle>{t("sectionDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("fullName")}
              placeholder={t("fullNamePlaceholder")}
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="bank"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("bank")}
                    placeholder={t("bankPlaceholder")}
                    options={
                      partnerBanks.length > 0
                        ? partnerBanks.map((b) => ({ value: b.name, label: b.name }))
                        : [
                            { value: "Bancobu", label: "Bancobu" },
                            { value: "BCB", label: "BCB" },
                            { value: "KCB", label: "KCB" },
                            { value: "Ecobank", label: "Ecobank" },
                          ]
                    }
                    error={errors.bank?.message}
                    {...field}
                  />
                )}
              />
              <Input
                label={t("accountNumber")}
                placeholder={t("accountNumberPlaceholder")}
                error={errors.accountNumber?.message}
                {...register("accountNumber")}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("amount")}
                type="number"
                placeholder={t("amountPlaceholder")}
                error={errors.amount?.message}
                {...register("amount", { valueAsNumber: true })}
              />
              <Input
                label={t("depositDate")}
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
                    label={t("investmentPeriod")}
                    placeholder={t("periodPlaceholder")}
                    options={PERIODS.map((p) => ({ value: p, label: p }))}
                    error={errors.investmentPeriod?.message}
                    {...field}
                  />
                )}
              />
              <Input
                label={t("referenceNumber")}
                placeholder={t("referencePlaceholder")}
                error={errors.referenceNumber?.message}
                {...register("referenceNumber")}
              />
            </div>
          </CardContent>
        </Card>

        {watchAmount > 0 && watchPeriod && (
          <Card className="border-emerald-100 bg-emerald-50">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-emerald-800 mb-3">{t("previewCard")}</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-emerald-600">Principal</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{formatCurrency(Number(watchAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">{t("atRate", { rate: selectedRate })}</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{selectedRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600">{t("estimatedInterest")}</p>
                  <p className="font-bold text-emerald-900 text-sm mt-1">{formatCurrency(expectedInterest)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>{t("receiptUpload")}</CardTitle></CardHeader>
          <CardContent>
            <FileUpload
              label={t("receiptDesc")}
              onChange={setReceipt}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("submitButton")}
          </Button>
        </div>
      </form>
    </div>
  );
}
