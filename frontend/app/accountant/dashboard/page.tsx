"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpFromLine,
  Bell,
  PiggyBank,
} from "lucide-react";
import { getDeposits, getWithdrawals, getNotifications } from "@/lib/mock-api";
import { useAuthStore } from "@/lib/auth-store";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvestoBarChart } from "@/components/ui/charts";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Deposit, Withdrawal, Notification } from "@/types";

export default function AccountantDashboard() {
  const { user } = useAuthStore();
  const t = useTranslations("accountant.dashboard");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDeposits(),
      getWithdrawals(),
      getNotifications(user.id),
    ]).then(([d, w, n]) => {
      setDeposits(d);
      setWithdrawals(w);
      setNotifications(n.slice(0, 10));
      setLoading(false);
    });
  }, [user]);

  const activityData = [
    { day: "Mon", deposits: 2, withdrawals: 1 },
    { day: "Tue", deposits: 3, withdrawals: 0 },
    { day: "Wed", deposits: 1, withdrawals: 2 },
    { day: "Thu", deposits: 4, withdrawals: 1 },
    { day: "Fri", deposits: 2, withdrawals: 1 },
    { day: "Sat", deposits: 1, withdrawals: 0 },
    { day: "Sun", deposits: 0, withdrawals: 0 },
  ];

  const pending = deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const recentlyConfirmed = deposits.filter((d) => d.status === "confirmed").slice(0, 5);
  const recentlyRejected = deposits.filter((d) => d.status === "rejected").slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t("pendingDeposits")}
          value={pending.length}
          icon={Clock}
          iconClassName="bg-amber-50"
        />
        <StatCard
          title={t("pendingWithdrawals")}
          value={pendingWithdrawals.length}
          icon={ArrowUpFromLine}
          iconClassName="bg-blue-50"
        />
        <StatCard
          title={t("confirmedDeposits")}
          value={recentlyConfirmed.length}
          icon={CheckCircle}
          iconClassName="bg-emerald-50"
        />
        <StatCard
          title={t("rejectedDeposits")}
          value={recentlyRejected.length}
          icon={XCircle}
          iconClassName="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("weeklyActivity")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InvestoBarChart
                data={activityData}
                xKey="day"
                bars={[
                  { key: "deposits", label: t("barDeposits"), color: "#0820ae" },
                  { key: "withdrawals", label: t("barWithdrawals"), color: "#10b981" },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Notifications panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t("notifications")}
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">{t("noPendingDeposits")}</p>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      !n.read ? "bg-blue-50/40" : ""
                    }`}
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
      </div>

      {/* Pending queue + Recently confirmed/rejected */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("pendingQueue")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pending.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">{t("noPendingDeposits")}</p>
            ) : (
              pending.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-6 py-3 border-b last:border-0 border-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.fullName}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(d.amount)} · {d.bank}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentlyConfirmed")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentlyConfirmed.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">{t("noConfirmedDeposits")}</p>
            ) : (
              recentlyConfirmed.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-6 py-3 border-b last:border-0 border-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.fullName}</p>
                    <p className="text-xs text-gray-400">
                      {formatCurrency(d.amount)} · {formatDate(d.depositDate)}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentlyRejected")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentlyRejected.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-400">{t("noRejections")}</p>
            ) : (
              recentlyRejected.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-6 py-3 border-b last:border-0 border-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.fullName}</p>
                    <p className="text-xs text-red-400 max-w-[180px] truncate">
                      {d.rejectionNote}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
