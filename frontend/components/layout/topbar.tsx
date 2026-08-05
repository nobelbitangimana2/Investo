"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
  unreadCount?: number;
}

export function Topbar({ onMenuClick, unreadCount = 0 }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNotifications = () => {
    if (user?.role === "client") router.push("/client/notifications");
    // Admin and accountant see notifications on their own dashboard; the bell just links there
    if (user?.role === "admin") router.push("/admin/dashboard");
    if (user?.role === "accountant") router.push("/accountant/dashboard");
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div>
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="font-semibold text-gray-900">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell — visible for all roles */}
        <button
          onClick={handleNotifications}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="User menu"
          >
            {user?.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-8 w-8 rounded-full bg-navy-100"
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
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-20">
                {user?.role === "client" && (
                  <button
                    onClick={() => {
                      router.push("/client/settings");
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Settings
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
