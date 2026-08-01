"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RouteGuard } from "@/components/layout/route-guard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRoles={["client"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
