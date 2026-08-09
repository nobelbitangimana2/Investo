"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, AlertTriangle, Info, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { submitWithdrawal, getInvestments } from "@/lib/mock-api";
import { withdrawalSchema, type WithdrawalFormValues } from "@/lib/zod-schemas";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Investment } from "@/types";

const BANKS = ["Bancobu", "BCB", "KCB", "Ecobank"];

export default function NewWithdrawalPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("client.withdrawals.form");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(true);

  useEffect(() => {
    if (!user) return;
    getInvestments(user.id, true).then((inv) => {
      setInvestments(inv);
      setLoadingInvestments(false);
    });
  }, [user]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      recipientName: user?.name ?? "",
    },
  });

  async function onSubmit(data: WithdrawalFormValues) {
    if (!user) return;

    if (totalBalance === 0) {
      toast.error(t("noBalance"));
      return;
    }

    if (totalBalance > 0 && data.amount > totalBalance) {
      toast.error(t("insufficientBalance", { amount: formatCurrency(totalBalance) }));
      return;
    }

    try {
      await submitWithdrawal(user.id, data);
      toast.success(t("successMessage"));
      router.push("/client/withdrawals");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit withdrawal.";
      toast.error(message);
    }
  }

  const totalPrincipal = investments.reduce((s, i) => s + i.currentPrincipal, 0);
  const totalAccruedInterest = investments.reduce((s, i) => s + i.accruedInterest, 0);
  const totalBalance = totalPrincipal + totalAccruedInterest;
  const activeInvestments = investments.filter((i) => i.status === "active");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/client/withdrawals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
      </div>

      {/* Processing notice */}
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">{t("processingNotice")}</p>
      </div>

      {/* Current balance summary */}
      {!loadingInvestments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-navy-600" />
              {t("availableBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-navy-50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <Wallet className="h-3 w-3" /> {t("totalBalance")}
                </p>
                <p className="text-lg font-bold text-navy-700">{formatCurrency(totalBalance)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t("maxWithdrawable")}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <PiggyBank className="h-3 w-3" /> {t("principal")}
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(totalPrincipal)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t("remainingCapital")}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" /> {t("accruedInterest")}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(totalAccruedInterest)}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t("deductedFirst")}</p>
              </div>
            </div>

            {activeInvestments.length > 1 && (
              <p className="text-xs text-gray-500 pt-1">
                {t("multipleInvestments", { count: activeInvestments.length })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Withdrawal rules info */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-blue-800">
          <p className="font-semibold text-sm">{t("howItWorks")}</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Interest first:</strong> {t("ruleInterestFirst")}</li>
            <li><strong>Multiple investments:</strong> {t("ruleMultiple", { count: activeInvestments.length })}</li>
            <li><strong>Future interest:</strong> {t("ruleFutureInterest")}</li>
            <li><strong>Maximum amount:</strong> {t("ruleMax")}</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>{t("sectionDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("fullName")}
              placeholder={t("fullNamePlaceholder")}
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller
                name="bankToTransferTo"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t("bankToTransfer")}
                    placeholder={t("bankPlaceholder")}
                    options={BANKS.map((b) => ({ value: b, label: b }))}
                    error={errors.bankToTransferTo?.message}
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
            <Input
              label={t("recipientName")}
              placeholder={t("recipientPlaceholder")}
              error={errors.recipientName?.message}
              {...register("recipientName")}
            />
            <div>
              <Input
                label={t("amount")}
                type="number"
                placeholder={t("amountPlaceholder")}
                error={errors.amount?.message}
                {...register("amount", { valueAsNumber: true })}
              />
              {totalBalance > 0 && (
                <p className="mt-1.5 text-xs text-gray-400">
                  {t("availableLabel")}{" "}
                  <span className="font-semibold text-gray-600">
                    {formatCurrency(totalBalance)}
                  </span>
                  {" "}· {t("minLabel")} {formatCurrency(1000)}
                </p>
              )}
            </div>
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
