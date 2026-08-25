"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, PiggyBank, ArrowUpFromLine, TrendingUp, Settings } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useNotificationStore } from "@/lib/notification-store";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Notification } from "@/types";
import { getNotificationText } from "@/lib/notification-text";

const typeConfig: Record<string, { color: string; icon: React.ReactNode; route: string }> = {
  deposit: {
    color: "bg-blue-500",
    icon: <PiggyBank className="h-4 w-4 text-blue-600" />,
    route: "/admin/deposits",
  },
  withdrawal: {
    color: "bg-amber-500",
    icon: <ArrowUpFromLine className="h-4 w-4 text-amber-600" />,
    route: "/admin/withdrawals",
  },
  investment: {
    color: "bg-emerald-500",
    icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
    route: "/admin/deposits",
  },
  system: {
    color: "bg-purple-500",
    icon: <Settings className="h-4 w-4 text-purple-600" />,
    route: "/admin/dashboard",
  },
};

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("admin.notifications");
  const tNotification = useTranslations("notificationContent");
  const { setUnreadCount } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then((n) => {
      setNotifications(n);
      setLoading(false);
    });
  }, [user]);

  async function handleClick(n: Notification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      // Decrement badge
      setUnreadCount(notifications.filter((x) => !x.read && x.id !== n.id).length);
    }
    const config = typeConfig[n.type] ?? typeConfig.system;
    router.push(config.route);
  }

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {unreadCount > 0 ? t("unread", { count: unreadCount }) : t("allCaughtUp")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="py-16 text-center">
          <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 font-medium">{t("noNotifications")}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type] ?? typeConfig.system;
            const text = getNotificationText(n, tNotification);
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left flex items-start gap-4 rounded-xl border p-4 transition-colors hover:shadow-sm",
                  !n.read
                    ? "bg-blue-50/40 border-blue-100 hover:bg-blue-50"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                )}
              >
                <div className={cn("mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full mt-2", config.color)} />
                <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium truncate", !n.read ? "text-gray-900" : "text-gray-700")}>
                        {text.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{text.message}</p>
                      <p className="text-xs text-navy-600 mt-1 font-medium">
                        {n.type === "deposit" ? t("goToDeposits") :
                         n.type === "withdrawal" ? t("goToWithdrawals") : t("view")}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {timeAgo(n.date)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
