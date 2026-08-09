"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PiggyBank,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Settings,
  Users,
  FileText,
  Shield,
  Percent,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // Client
  { label: "Dashboard", icon: LayoutDashboard, href: "/client/dashboard", roles: ["client"] },
  { label: "New Deposit", icon: ArrowDownToLine, href: "/client/deposits/new", roles: ["client"] },
  { label: "Deposits", icon: PiggyBank, href: "/client/deposits", roles: ["client"] },
  { label: "New Withdrawal", icon: ArrowUpFromLine, href: "/client/withdrawals/new", roles: ["client"] },
  { label: "Withdrawals", icon: ArrowUpFromLine, href: "/client/withdrawals", roles: ["client"] },
  { label: "Investments", icon: TrendingUp, href: "/client/investments", roles: ["client"] },
  { label: "Notifications", icon: Bell, href: "/client/notifications", roles: ["client"] },
  { label: "Settings", icon: Settings, href: "/client/settings", roles: ["client"] },

  // Accountant
  { label: "Dashboard", icon: LayoutDashboard, href: "/accountant/dashboard", roles: ["accountant"] },
  { label: "Deposits", icon: PiggyBank, href: "/accountant/deposits", roles: ["accountant"] },
  { label: "Withdrawals", icon: ArrowUpFromLine, href: "/accountant/withdrawals", roles: ["accountant"] },
  { label: "Notifications", icon: Bell, href: "/accountant/notifications", roles: ["accountant"] },
  { label: "Reports", icon: FileBarChart, href: "/accountant/reports", roles: ["accountant"] },
  { label: "Settings", icon: Settings, href: "/accountant/settings", roles: ["accountant"] },

  // Admin
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", roles: ["admin"] },
  { label: "Deposits", icon: PiggyBank, href: "/admin/deposits", roles: ["admin"] },
  { label: "Withdrawals", icon: ArrowUpFromLine, href: "/admin/withdrawals", roles: ["admin"] },
  { label: "Clients", icon: Users, href: "/admin/clients", roles: ["admin"] },
  { label: "Accountants", icon: Shield, href: "/admin/accountants", roles: ["admin"] },
  { label: "Interest Rates", icon: Percent, href: "/admin/interest-rates", roles: ["admin"] },
  { label: "Notifications", icon: Bell, href: "/admin/notifications", roles: ["admin"] },
  { label: "Reports", icon: FileBarChart, href: "/admin/reports", roles: ["admin"] },
  { label: "Audit Logs", icon: FileText, href: "/admin/audit-logs", roles: ["admin"] },
  { label: "Settings", icon: Settings, href: "/admin/settings", roles: ["admin"] },
];

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-gray-200 bg-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-700">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-navy-900">Investo</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1" role="navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-navy-50 text-navy-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
