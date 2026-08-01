"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/layout/route-guard";

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["accountant"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
