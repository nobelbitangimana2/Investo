"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/layout/route-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
