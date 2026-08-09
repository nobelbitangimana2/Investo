"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/mock-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Notification } from "@/types";

const typeColors: Record<string, string> = {
  deposit: "bg-blue-500",
  withdrawal: "bg-amber-500",
  investment: "bg-emerald-500",
  system: "bg-purple-500",
};

export default function ClientNotificationsPage() {
  const { user } = useAuthStore();
  const t = useTranslations("client.notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then((n) => { setNotifications(n); setLoading(false); });
  }, [user]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  async function handleMarkAll() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 transition-colors",
                !n.read ? "bg-blue-50/40 border-blue-100" : "bg-white border-gray-100"
              )}
            >
              <div className={cn("mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full", typeColors[n.type] ?? "bg-gray-400")} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn("text-sm font-medium", !n.read ? "text-gray-900" : "text-gray-700")}>
                      {n.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {timeAgo(n.date)}
                  </span>
                </div>
              </div>
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-navy-600 hover:underline flex-shrink-0"
                >
                  {t("markRead")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
