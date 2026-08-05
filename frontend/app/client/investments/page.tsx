"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { getInvestments } from "@/lib/mock-api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, Calendar, Percent, DollarSign, Info, PiggyBank } from "lucide-react";
import type { Investment } from "@/types";

export default function ClientInvestmentsPage() {
  const { user } = useAuthStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getInvestments(user.id).then((i) => {
      setInvestments(i);
      setLoading(false);
    });
  }, [user]);

  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalBalance = investments.reduce(
    (s, inv) => s + inv.currentPrincipal + inv.accruedInterest,
    0
  );

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
        <h1 className="text-2xl font-bold text-gray-900">My Investments</h1>
        <p className="text-gray-500 mt-0.5 text-sm">
          {investments.length} investment{investments.length !== 1 ? "s" : ""} ·{" "}
          {activeInvestments.length} active
        </p>
      </div>

      {/* Withdrawal rules info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-blue-800">
          <p className="font-semibold">How withdrawals work</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-700 text-xs">
            <li>
              Interest is always deducted first, then principal — your capital is protected as long
              as possible.
            </li>
            <li>
              If you have multiple investments, the withdrawal is distributed proportionally across
              all of them based on their current value.
            </li>
            <li>
              Future interest is calculated only on the remaining principal after each withdrawal.
            </li>
            <li>
              Maximum withdrawal = Current Principal + Accrued Interest (your current balance).
            </li>
          </ul>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No investments yet</p>
          <p className="text-sm mt-1">Submit a deposit to start your investment journey</p>
        </div>
      ) : (
        <>
          {/* Portfolio summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-navy-600 text-white border-0">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-white/70">Total Balance</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                <p className="text-[11px] text-white/60 mt-0.5">Principal + accrued interest</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-gray-500">Total Principal</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(investments.reduce((s, i) => s + i.currentPrincipal, 0))}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Remaining capital</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-gray-500">Total Accrued Interest</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">
                  {formatCurrency(investments.reduce((s, i) => s + i.accruedInterest, 0))}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Earned so far</p>
              </CardContent>
            </Card>
          </div>

          {/* Individual investment cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investments.map((inv) => {
              const balance = inv.currentPrincipal + inv.accruedInterest;
              return (
                <Card key={inv.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(inv.amount)}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {inv.investmentPeriod} Investment
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    {/* Balance breakdown */}
                    <div className="mb-4 rounded-lg bg-gray-50 p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <PiggyBank className="h-3.5 w-3.5" />
                          Current Principal
                        </span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(inv.currentPrincipal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          Accrued Interest
                        </span>
                        <span className="font-semibold text-emerald-600">
                          +{formatCurrency(inv.accruedInterest)}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-gray-200 flex justify-between text-sm">
                        <span className="font-medium text-gray-700">Current Balance</span>
                        <span className="font-bold text-gray-900">{formatCurrency(balance)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                          <Percent className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Interest Rate</p>
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
                          <p className="text-xs text-gray-400">Expected Interest</p>
                          <p className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(inv.expectedInterest)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Confirmed</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDate(inv.confirmationDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Matures</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDate(inv.maturityDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>Deposit: {inv.depositId}</span>
                      <span>ID: {inv.id}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
