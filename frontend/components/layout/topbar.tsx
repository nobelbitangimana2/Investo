"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/auth-store";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
  unreadCount?: number;
}

export function Topbar({ onMenuClick, unreadCount = 0 }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("topbar");
  const tCommon = useTranslations("common");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNotifications = () => {
    if (user?.role === "client") router.push("/client/notifications");
    if (user?.role === "admin") router.push("/admin/notifications");
    if (user?.role === "accountant") router.push("/accountant/notifications");
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("welcomeBack")}</p>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <LanguageSwitcher />
        {/* Dark/Light mode toggle */}
        <ThemeToggle />

        {/* Notification bell — visible for all roles */}
        <button
          onClick={handleNotifications}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label={t("notifications")}
        >
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={t("userMenu")}
          >
            {user?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-8 w-8 rounded-full bg-navy-100 object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-semibold">
                {getInitials(user?.name ?? "U")}
              </div>
            )}
            <Badge variant="secondary" className="text-xs capitalize">
              {user?.role}
            </Badge>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 shadow-lg z-20">
                {user?.role === "client" && (
                  <button
                    onClick={() => { router.push("/client/settings"); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {tCommon("settings")}
                  </button>
                )}
                {user?.role === "admin" && (
                  <button
                    onClick={() => { router.push("/admin/settings"); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {tCommon("settings")}
                  </button>
                )}
                {user?.role === "accountant" && (
                  <button
                    onClick={() => { router.push("/accountant/settings"); setShowUserMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {tCommon("settings")}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {tCommon("logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
