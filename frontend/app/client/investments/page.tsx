"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { getInvestments, getWithdrawals } from "@/lib/mock-api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Calendar,
  Percent,
  DollarSign,
  Info,
  PiggyBank,
  RefreshCw,
  ArrowUpFromLine,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Investment, Withdrawal } from "@/types";

function getPeriodDays(period: string): number {
  const map: Record<string, number> = {
    Weekly: 7,
    Monthly: 30,
    "3 Months": 90,
    "6 Months": 180,
    "1 Year": 365,
    "5 Years": 1825,
  };
  return map[period] ?? 30;
}

function getCompletedCycles(inv: Investment): number {
  const start = new Date(inv.confirmationDate).getTime();
  const now = Date.now();
  const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const periodDays = getPeriodDays(inv.investmentPeriod);
  return Math.floor(elapsedDays / periodDays);
}

function getExpectedInterestPerCycle(inv: Investment): number {
  return Number(inv.currentPrincipal) * (Number(inv.interestRate) / 100);
}

export default function ClientInvestmentsPage() {
  const { user } = useAuthStore();
  const t = useTranslations("client.investments");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getInvestments(user.id, true),
      getWithdrawals(user.id, true),
    ]).then(([i, w]) => {
      setInvestments(i);
      setWithdrawals(w);
      setLoading(false);
    });
  }, [user]);

  const totalBalance = investments.reduce(
    (s, inv) => s + Number(inv.currentPrincipal) + Number(inv.accruedInterest),
    0,
  );

  const totalExpectedInterest = investments.reduce(
    (s, inv) => s + getExpectedInterestPerCycle(inv),
    0,
  );

  const withdrawalColumns: Column<Withdrawal>[] = [
    { key: "requestedAt", header: "Date", cell: (r) => formatDate(r.requestedAt) },
    { key: "bankToTransferTo", header: "Bank" },
    { key: "accountNumber", header: "Account" },
    { key: "amount", header: "Amount", cell: (r) => formatCurrency(r.amount) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "rejectionNote",
      header: "Note",
      cell: (r) =>
        r.rejectionNote ? (
          <span className="text-xs text-red-500 max-w-[140px] block truncate" title={r.rejectionNote}>
            {r.rejectionNote}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-0.5 text-sm">
          {investments.length !== 1
            ? t("subtitlePlural", { count: investments.length })
            : t("subtitle", { count: investments.length })}
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-blue-800">
          <p className="font-semibold">{t("howItWorksTitle")}</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700 text-xs">
            <li>{t("rulePerp")}</li>
            <li>{t("ruleExpected")}</li>
            <li>{t("ruleWithdrawal")}</li>
          </ul>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{t("noInvestments")}</p>
          <p className="text-sm mt-1">{t("noInvestmentsSubtitle")}</p>
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-navy-600 text-white border-0">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-white/70">{t("totalBalance")}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-[11px] text-white/60 mt-0.5">{t("principalAccrued")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-gray-500">{t("totalPrincipal")}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(investments.reduce((s, i) => s + Number(i.currentPrincipal), 0))}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{t("remainingCapital")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-gray-500">{t("expectedInterestCycle")}</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalExpectedInterest)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{t("updatesWithDeposit")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Individual investment cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.map((inv) => {
              const balance = Number(inv.currentPrincipal) + Number(inv.accruedInterest);
              const cycles = getCompletedCycles(inv);
              const expectedPerCycle = getExpectedInterestPerCycle(inv);
              return (
                <Card key={inv.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(Number(inv.amount))}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {inv.investmentPeriod} · {t("perpetual")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={inv.status} />
                        {cycles > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <RefreshCw className="h-3 w-3" />
                            {cycles !== 1
                              ? t("cyclesCompletedPlural", { count: cycles })
                              : t("cyclesCompleted", { count: cycles })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Balance breakdown */}
                    <div className="mb-4 rounded-lg bg-gray-50 p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <PiggyBank className="h-3.5 w-3.5" />
                          {t("currentPrincipal")}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(Number(inv.currentPrincipal))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          {t("accruedInterest")}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          +{formatCurrency(Number(inv.accruedInterest))}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-gray-200 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{t("currentBalance")}</span>
                        <span className="font-bold text-gray-900">{formatCurrency(balance)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                          <Percent className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{t("interestRate")}</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {inv.interestRate}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{t("expectedPerCycle")}</p>
                          <p className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(expectedPerCycle)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{t("started")}</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDate(inv.confirmationDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                          <RefreshCw className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">{t("cyclesDone")}</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {cycles}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Withdrawal History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-gray-600" />
                {t("withdrawalHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">{t("noWithdrawals")}</p>
              ) : (
                <DataTable
                  data={withdrawals}
                  columns={withdrawalColumns}
                  searchable={false}
                  pageSize={5}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
