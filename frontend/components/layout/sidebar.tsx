"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  labelKey: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  // Client
  { labelKey: "dashboard", icon: LayoutDashboard, href: "/client/dashboard", roles: ["client"] },
  { labelKey: "newDeposit", icon: ArrowDownToLine, href: "/client/deposits/new", roles: ["client"] },
  { labelKey: "deposits", icon: PiggyBank, href: "/client/deposits", roles: ["client"] },
  { labelKey: "newWithdrawal", icon: ArrowUpFromLine, href: "/client/withdrawals/new", roles: ["client"] },
  { labelKey: "withdrawals", icon: ArrowUpFromLine, href: "/client/withdrawals", roles: ["client"] },
  { labelKey: "investments", icon: TrendingUp, href: "/client/investments", roles: ["client"] },
  { labelKey: "partnerBanks", icon: Building2, href: "/client/banks", roles: ["client"] },
  { labelKey: "notifications", icon: Bell, href: "/client/notifications", roles: ["client"] },
  { labelKey: "settings", icon: Settings, href: "/client/settings", roles: ["client"] },

  // Accountant
  { labelKey: "dashboard", icon: LayoutDashboard, href: "/accountant/dashboard", roles: ["accountant"] },
  { labelKey: "deposits", icon: PiggyBank, href: "/accountant/deposits", roles: ["accountant"] },
  { labelKey: "withdrawals", icon: ArrowUpFromLine, href: "/accountant/withdrawals", roles: ["accountant"] },
  { labelKey: "partnerBanks", icon: Building2, href: "/accountant/banks", roles: ["accountant"] },
  { labelKey: "notifications", icon: Bell, href: "/accountant/notifications", roles: ["accountant"] },
  { labelKey: "reports", icon: FileBarChart, href: "/accountant/reports", roles: ["accountant"] },
  { labelKey: "settings", icon: Settings, href: "/accountant/settings", roles: ["accountant"] },

  // Admin
  { labelKey: "dashboard", icon: LayoutDashboard, href: "/admin/dashboard", roles: ["admin"] },
  { labelKey: "deposits", icon: PiggyBank, href: "/admin/deposits", roles: ["admin"] },
  { labelKey: "withdrawals", icon: ArrowUpFromLine, href: "/admin/withdrawals", roles: ["admin"] },
  { labelKey: "clients", icon: Users, href: "/admin/clients", roles: ["admin"] },
  { labelKey: "accountants", icon: Shield, href: "/admin/accountants", roles: ["admin"] },
  { labelKey: "interestRates", icon: Percent, href: "/admin/interest-rates", roles: ["admin"] },
  { labelKey: "partnerBanks", icon: Building2, href: "/admin/banks", roles: ["admin"] },
  { labelKey: "notifications", icon: Bell, href: "/admin/notifications", roles: ["admin"] },
  { labelKey: "reports", icon: FileBarChart, href: "/admin/reports", roles: ["admin"] },
  { labelKey: "auditLogs", icon: FileText, href: "/admin/audit-logs", roles: ["admin"] },
  { labelKey: "settings", icon: Settings, href: "/admin/settings", roles: ["admin"] },
];

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-[#173457] bg-[#071d38] text-white min-h-screen flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-white/10">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt="Investo logo"
            width={40}
            height={40}
            className="rounded-xl object-cover"
            priority
          />
          <span className="text-xl font-bold text-white">Investo</span>
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
                  ? "bg-navy-600 text-white shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(item.labelKey as Parameters<typeof t>[0])}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
