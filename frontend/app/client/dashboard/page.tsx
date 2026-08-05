"use client";

import { useEffect, useState } from "react";
import {
  PiggyBank,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ArrowUpFromLine,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getDeposits, getWithdrawals, getInvestments, getNotifications } from "@/lib/mock-api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import type { Deposit, Withdrawal, Investment, Notification } from "@/types";

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDeposits(user.id),
      getWithdrawals(user.id),
      getInvestments(user.id),
      getNotifications(user.id),
    ]).then(([d, w, i, n]) => {
      setDeposits(d);
      setWithdrawals(w);
      setInvestments(i);
      setNotifications(n.slice(0, 5));
      setLoading(false);
    });
  }, [user]);

  const confirmedDeposits = deposits.filter((d) => d.status === "confirmed");
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeInvestments = investments.filter((i) => i.status === "active");

  // Balance = sum of (currentPrincipal + accruedInterest) across ALL investments (active + matured)
  const totalBalance = investments.reduce(
    (s, inv) => s + inv.currentPrincipal + inv.accruedInterest,
    0
  );

  const totalExpectedInterest = activeInvestments.reduce((s, i) => s + i.expectedInterest, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-0.5">Your investment overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Deposited"
          value={formatCurrency(totalDeposited)}
          icon={PiggyBank}
        />
        <StatCard
          title="Current Balance"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          iconClassName="bg-emerald-50"
          description="Principal + accrued interest"
        />
        <StatCard
          title="Expected Interest"
          value={formatCurrency(totalExpectedInterest)}
          icon={TrendingUp}
          iconClassName="bg-amber-50"
        />
        <StatCard
          title="Active Investments"
          value={activeInvestments.length}
          icon={CheckCircle}
          iconClassName="bg-purple-50"
        />
        <StatCard
          title="Pending Deposits"
          value={deposits.filter((d) => d.status === "pending").length}
          icon={Clock}
          iconClassName="bg-amber-50"
        />
        <StatCard
          title="Confirmed Deposits"
          value={confirmedDeposits.length}
          icon={CheckCircle}
          iconClassName="bg-emerald-50"
        />
        <StatCard
          title="Pending Withdrawals"
          value={withdrawals.filter((w) => w.status === "pending").length}
          icon={ArrowUpFromLine}
          iconClassName="bg-blue-50"
        />
        <StatCard
          title="Rejected Deposits"
          value={deposits.filter((d) => d.status === "rejected").length}
          icon={XCircle}
          iconClassName="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deposits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deposits.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-gray-400">No deposits yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {deposits.slice(0, 5).map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(dep.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dep.bank} · {dep.investmentPeriod} · {formatDate(dep.depositDate)}
                      </p>
                    </div>
                    <StatusBadge status={dep.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Investments */}
        <Card>
          <CardHeader>
            <CardTitle>Active Investments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeInvestments.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-gray-400">No active investments.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeInvestments.map((inv) => {
                  const balance = inv.currentPrincipal + inv.accruedInterest;
                  return (
                    <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {formatCurrency(inv.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {inv.investmentPeriod} · {inv.interestRate}% · matures{" "}
                          {formatDate(inv.maturityDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-emerald-600">
                          {formatCurrency(balance)}
                        </p>
                        <p className="text-[10px] text-gray-400">current balance</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-gray-400">No notifications.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-6 py-3 ${!n.read ? "bg-blue-50/30" : ""}`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        !n.read ? "bg-blue-500" : "bg-transparent"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-400">{timeAgo(n.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {withdrawals.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-gray-400">No withdrawals yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {withdrawals.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatCurrency(w.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {w.bankToTransferTo} · {timeAgo(w.requestedAt)}
                      </p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
