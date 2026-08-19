"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getAllPartnerBanks,
  createPartnerBank,
  updatePartnerBank,
  deletePartnerBank,
} from "@/lib/mock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import type { PartnerBank } from "@/types";

// ── Validation schema ──────────────────────────────────────────────────────
const bankSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  accountName: z.string().optional(),
  accountNumber: z.string().min(4, "Account number is required"),
  isActive: z.boolean().optional(),
});

type BankFormValues = z.infer<typeof bankSchema>;

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminPartnerBanksPage() {
  const t = useTranslations("admin.banks");
  const toast = useToast();

  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PartnerBank | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartnerBank | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: { isActive: true, accountName: "Investo" },
  });

  const watchIsActive = watch("isActive");

  // ── Load banks ─────────────────────────────────────────────────────────
  useEffect(() => {
    getAllPartnerBanks()
      .then((b) => setBanks(b))
      .catch(() => toast.error("Failed to load partner banks"))
      .finally(() => setLoading(false));
  }, []);

  // ── Open add modal ─────────────────────────────────────────────────────
  function openAdd() {
    reset({ name: "", accountName: "Investo", accountNumber: "", isActive: true });
    setEditTarget(null);
    setShowAdd(true);
  }

  // ── Open edit modal ────────────────────────────────────────────────────
  function openEdit(bank: PartnerBank) {
    setEditTarget(bank);
    setValue("name", bank.name);
    setValue("accountName", bank.accountName);
    setValue("accountNumber", bank.accountNumber);
    setValue("isActive", bank.isActive);
    setShowAdd(true);
  }

  function closeModal() {
    setEditTarget(null);
    setShowAdd(false);
    reset();
  }

  // ── Submit (create / update) ───────────────────────────────────────────
  async function onSubmit(data: BankFormValues) {
    try {
      if (editTarget) {
        const updated = await updatePartnerBank(editTarget.id, {
          name: data.name,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          isActive: data.isActive ?? true,
        });
        setBanks((prev) =>
          prev.map((b) => (b.id === editTarget.id ? updated : b))
        );
        toast.success(t("bankUpdated", { name: data.name }));
      } else {
        const created = await createPartnerBank({
          name: data.name,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          isActive: data.isActive ?? true,
        });
        setBanks((prev) => [...prev, created]);
        toast.success(t("bankAdded", { name: data.name }));
      }
      closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save bank");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePartnerBank(deleteTarget.id);
      setBanks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast.success(t("bankDeleted", { name: deleteTarget.name }));
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bank");
    } finally {
      setDeleting(false);
    }
  }

  // ── Toggle active status inline ────────────────────────────────────────
  async function toggleActive(bank: PartnerBank) {
    try {
      const updated = await updatePartnerBank(bank.id, { isActive: !bank.isActive });
      setBanks((prev) => prev.map((b) => (b.id === bank.id ? updated : b)));
    } catch {
      toast.error("Failed to update status");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {t("addBank")}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {[
                    t("colName"),
                    t("colAccountName"),
                    t("colAccountNumber"),
                    t("colStatus"),
                    t("colActions"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : banks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-400 dark:text-gray-500"
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No partner banks yet. Add your first bank.
                    </td>
                  </tr>
                ) : (
                  banks.map((bank) => (
                    <tr
                      key={bank.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {bank.name}
                          </span>
                        </div>
                      </td>
                      {/* Account Name */}
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {bank.accountName}
                      </td>
                      {/* Account Number */}
                      <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-300">
                        {bank.accountNumber}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(bank)}
                          className="flex items-center gap-1.5 group"
                          title={bank.isActive ? t("statusActive") : t("statusInactive")}
                        >
                          {bank.isActive ? (
                            <ToggleRight className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-gray-400" />
                          )}
                          <span
                            className={
                              bank.isActive
                                ? "text-xs font-medium text-emerald-600"
                                : "text-xs font-medium text-gray-400"
                            }
                          >
                            {bank.isActive ? t("statusActive") : t("statusInactive")}
                          </span>
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEdit(bank)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(bank)}
                            title="Delete"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={showAdd}
        onClose={closeModal}
        title={editTarget ? t("editTitle") : t("addTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label={t("nameLabel")}
            placeholder={t("namePlaceholder")}
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label={t("accountNameLabel")}
            placeholder={t("accountNamePlaceholder")}
            error={errors.accountName?.message}
            {...register("accountName")}
          />
          <Input
            label={t("accountNumberLabel")}
            placeholder={t("accountNumberPlaceholder")}
            error={errors.accountNumber?.message}
            {...register("accountNumber")}
          />
          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={watchIsActive}
              onClick={() => setValue("isActive", !watchIsActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 ${
                watchIsActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  watchIsActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("isActiveLabel")}
            </span>
          </label>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("saveBank")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
      >
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          {t("deleteConfirmMessage", { name: deleteTarget?.name ?? "" })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={deleting}
            onClick={confirmDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
