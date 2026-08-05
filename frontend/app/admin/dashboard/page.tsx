"use client";

import { useEffect, useState } from "react";
import {
  Users,
  PiggyBank,
  TrendingUp,
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Bell,
} from "lucide-react";
import {
  getDeposits,
  getWithdrawals,
  getInvestments,
  getClients,
  getNotifications,
} from "@/lib/mock-api";
import { useAuthStore } from "@/lib/auth-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestoLineChart, InvestoBarChart, InvestoPieChart } from "@/components/ui/charts";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, timeAgo } from "@/lib/utils";
import type { Deposit, Withdrawal, Investment, User, Notification } from "@/types";

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDeposits(),
      getWithdrawals(),
      getInvestments(),
      getClients(),
      getNotifications(user.id),
    ]).then(([d, w, i, c, n]) => {
      setDeposits(d);
      setWithdrawals(w);
      setInvestments(i);
      setClients(c);
      setNotifications(n.slice(0, 8));
      setLoading(false);
    });
  }, [user]);

  const confirmedDeposits = deposits.filter((d) => d.status === "confirmed");
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + Number(d.amount), 0);
  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalExpectedInterest = activeInvestments.reduce((s, i) => s + Number(i.expectedInterest), 0);
  const totalMaturityValue = activeInvestments.reduce((s, i) => s + Number(i.expectedMaturityValue), 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Growth trend chart (mock monthly data)
  const trendData = [
    { month: "Jan", deposits: 3, investments: 2, clients: 2 },
    { month: "Feb", deposits: 4, investments: 3, clients: 3 },
    { month: "Mar", deposits: 5, investments: 4, clients: 4 },
    { month: "Apr", deposits: 4, investments: 3, clients: 4 },
    { month: "May", deposits: 6, investments: 5, clients: 5 },
    { month: "Jun", deposits: 8, investments: 6, clients: 5 },
  ];

  const periodData = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"]
    .map((p) => ({
      name: p,
      value: investments.filter((i) => i.investmentPeriod === p).length,
    }))
    .filter((x) => x.value > 0);

  const bankData = ["Bancobu", "BCB", "KCB", "Ecobank"].map((bank) => ({
    bank,
    amount:
      confirmedDeposits
        .filter((d) => d.bank === bank)
        .reduce((s, d) => s + Number(d.amount), 0) / 1_000_000,
  }));

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
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-0.5">Platform-wide overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clients.length} icon={Users} />
        <StatCard
          title="Total Deposited"
          value={formatCurrency(totalDeposited)}
          icon={PiggyBank}
        />
        <StatCard
          title="Active Investments"
          value={activeInvestments.length}
          icon={TrendingUp}
          iconClassName="bg-emerald-50"
        />
        <StatCard
          title="Expected Interest"
          value={formatCurrency(totalExpectedInterest)}
          icon={DollarSign}
          iconClassName="bg-amber-50"
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
          title="Total Maturity Value"
          value={formatCurrency(totalMaturityValue)}
          icon={XCircle}
          iconClassName="bg-purple-50"
        />
      </div>

      {/* Notifications + Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">No notifications.</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-blue-50/40" : ""}`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        !n.read ? "bg-blue-500" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.date)}</p>
                    </div>
                    {n.type === "deposit" ? (
                      <PiggyBank className="h-4 w-4 flex-shrink-0 text-navy-400 mt-0.5" />
                    ) : n.type === "withdrawal" ? (
                      <ArrowUpFromLine className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends (6 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <InvestoLineChart
                data={trendData}
                xKey="month"
                lines={[
                  { key: "deposits", label: "Deposits", color: "#0820ae" },
                  { key: "investments", label: "Investments", color: "#10b981" },
                  { key: "clients", label: "New Clients", color: "#f59e0b" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Investment Period Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestoPieChart data={periodData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Volume by Bank (M BIF)</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestoBarChart
              data={bankData}
              xKey="bank"
              bars={[{ key: "amount", label: "Amount (M BIF)", color: "#0820ae" }]}
              yFormatter={(v) => `${v.toFixed(1)}M`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming maturities */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Maturities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeInvestments.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-400">No active investments.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeInvestments.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatCurrency(inv.amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inv.investmentPeriod} · matures {inv.maturityDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-emerald-600">
                      +{formatCurrency(inv.expectedInterest)}
                    </p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
