"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { getAccountantPermissions } from "@/lib/mock-api";
import type { AccountantPermissions } from "@/types";

type PermissionKey = keyof Omit<AccountantPermissions, "userId">;

export function useHasPermission(permission: PermissionKey): boolean {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!user) { setHasPermission(false); return; }
    // Admins have all permissions
    if (user.role === "admin") { setHasPermission(true); return; }
    if (user.role !== "accountant") { setHasPermission(false); return; }

    getAccountantPermissions(user.id).then((perms) => {
      setHasPermission(perms ? perms[permission] : false);
    });
  }, [user, permission]);

  return hasPermission;
}

export function useAccountantPermissions(): AccountantPermissions | null {
  const { user } = useAuthStore();
  const [perms, setPerms] = useState<AccountantPermissions | null>(null);

  useEffect(() => {
    if (!user || user.role !== "accountant") return;
    getAccountantPermissions(user.id).then(setPerms);
  }, [user]);

  return perms;
}
