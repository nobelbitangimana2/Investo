"use client";

import { useEffect, useState } from "react";
import { Plus, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAccountants,
  getAccountantPermissions,
  createAccountant,
  updateAccountantPermissions,
  updateUserStatus,
} from "@/lib/mock-api";
import { accountantSchema, type AccountantFormValues } from "@/lib/zod-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/useToast";
import { getInitials, formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { User, AccountantPermissions } from "@/types";

type PermKey = keyof Omit<AccountantPermissions, "userId">;

export default function AdminAccountantsPage() {
  const t = useTranslations("admin.accountants");

  const PERM_LABELS: [PermKey, string][] = [
    ["viewDeposits", t("permViewDeposits")],
    ["viewWithdraws", t("permViewWithdrawals")],
    ["confirmDeposits", t("permConfirmDeposits")],
    ["rejectDeposits", t("permRejectDeposits")],
    ["confirmWithdraws", t("permConfirmWithdrawals")],
    ["rejectWithdraws", t("permRejectWithdrawals")],
    ["generateReports", t("permGenerateReports")],
  ];

  const [accountants, setAccountants] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Record<string, AccountantPermissions>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountantFormValues>({ resolver: zodResolver(accountantSchema) });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const accs = await getAccountants();
    setAccountants(accs);
    const permsMap: Record<string, AccountantPermissions> = {};
    for (const acc of accs) {
      const p = await getAccountantPermissions(acc.id);
      if (p) permsMap[acc.id] = p;
    }
    setPermissions(permsMap);
    setLoading(false);
  }

  async function handleCreate(data: AccountantFormValues) {
    await createAccountant(data);
    toast.success(t("accountantCreated"));
    reset();
    setShowCreate(false);
    await loadData();
  }

  async function togglePerm(userId: string, key: PermKey) {
    const current = permissions[userId];
    if (!current) return;
    const updated = await updateAccountantPermissions(userId, { [key]: !current[key] });
    setPermissions((prev) => ({ ...prev, [userId]: updated }));
    toast.success(t("permissionsUpdated"));
  }

  async function toggleStatus(acc: User) {
    const newStatus = acc.status === "active" ? "suspended" : "active";
    await updateUserStatus(acc.id, newStatus);
    setAccountants((prev) => prev.map((a) => (a.id === acc.id ? { ...a, status: newStatus } : a)));
    toast.info(newStatus === "active" ? t("accountActivated") : t("accountSuspended"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> {t("addAccountant")}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : accountants.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{t("noAccountants")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accountants.map((acc) => {
            const perms = permissions[acc.id];
            return (
              <Card key={acc.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-semibold">
                        {getInitials(acc.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{acc.name}</p>
                        <p className="text-sm text-gray-400">{acc.email}</p>
                        <p className="text-xs text-gray-300 mt-0.5">Created {formatDate(acc.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={acc.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPerms(acc.id === editingPerms ? null : acc.id)}
                      >
                        {t("permissions")}
                      </Button>
                      <Button
                        variant={acc.status === "active" ? "destructive" : "success"}
                        size="sm"
                        onClick={() => toggleStatus(acc)}
                      >
                        {acc.status === "active" ? t("suspend") : t("activate")}
                      </Button>
                    </div>
                  </div>

                  {editingPerms === acc.id && perms && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{t("permissions")}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {PERM_LABELS.map(([key, label]) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={perms[key]}
                              onChange={() => togglePerm(acc.id, key)}
                              className="h-4 w-4 rounded border-gray-300 text-navy-700 focus:ring-navy-700"
                            />
                            <span className="text-sm text-gray-700">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title={t("createTitle")}>
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4" noValidate>
          <Input label={t("name")} placeholder="Grace Iradukunda" error={errors.name?.message} {...register("name")} />
          <Input label={t("email")} type="email" placeholder="grace@investo.bi" error={errors.email?.message} {...register("email")} />
          <Input label={t("password")} type="password" placeholder="Min. 8 characters" error={errors.password?.message} {...register("password")} />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
