"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { getInterestRates, upsertInterestRate, deleteInterestRate } from "@/lib/mock-api";
import { interestRateSchema, type InterestRateFormValues } from "@/lib/zod-schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { InterestRate } from "@/types";

type ModalMode = "add" | "edit" | null;

export default function AdminInterestRatesPage() {
  const t = useTranslations("admin.interestRates");
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<InterestRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InterestRate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InterestRateFormValues>({ resolver: zodResolver(interestRateSchema) });

  useEffect(() => {
    getInterestRates().then((r) => { setRates(r); setLoading(false); });
  }, []);

  // Set of period names already in the DB (case-insensitive check)
  const configuredPeriods = new Set(rates.map((r) => r.investmentPeriod.toLowerCase()));

  // Watch the period field for live duplicate detection in the Add modal
  const watchedPeriod = watch("investmentPeriod") ?? "";
  const isDuplicate = watchedPeriod.trim().length >= 2 && configuredPeriods.has(watchedPeriod.trim().toLowerCase());

  // ── Open Add modal ─────────────────────────────────────────────────────
  function openAdd() {
    reset({ investmentPeriod: "", ratePercentage: undefined });
    setEditTarget(null);
    setModalMode("add");
  }

  // ── Open Edit modal ────────────────────────────────────────────────────
  function openEdit(rate: InterestRate) {
    setValue("investmentPeriod", rate.investmentPeriod);
    setValue("ratePercentage", rate.ratePercentage);
    setEditTarget(rate);
    setModalMode("edit");
  }

  // ── Close any modal ────────────────────────────────────────────────────
  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
    reset();
  }

  // ── Save (create or update) ────────────────────────────────────────────
  async function onSubmit(data: InterestRateFormValues) {
    try {
      const saved = await upsertInterestRate(data.investmentPeriod, data.ratePercentage);
      setRates((prev) => {
        const exists = prev.find((r) => r.investmentPeriod === saved.investmentPeriod);
        return exists
          ? prev.map((r) => (r.investmentPeriod === saved.investmentPeriod ? saved : r))
          : [...prev, saved];
      });
      toast.success(t("rateUpdated", { period: data.investmentPeriod, rate: data.ratePercentage }));
      closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save rate");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInterestRate(deleteTarget.investmentPeriod);
      setRates((prev) => prev.filter((r) => r.investmentPeriod !== deleteTarget.investmentPeriod));
      toast.success(t("rateDeleted", { period: deleteTarget.investmentPeriod }));
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete rate");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> {t("addRate")}
        </Button>
      </div>

      {/* Rates table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {[t("colPeriod"), t("colRate"), t("colLastUpdated"), t("colActions")].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                      No interest rates configured yet.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                        {rate.investmentPeriod}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold text-base">
                          {rate.ratePercentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 dark:text-gray-500">
                        {formatDate(rate.dateUpdated)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => openEdit(rate)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(rate)}
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

      {/* ── ADD modal — free-text period input + rate input ────────────── */}
      <Modal
        open={modalMode === "add"}
        onClose={closeModal}
        title={t("addTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Period — free text, validated for duplicates inline */}
          <div className="space-y-1">
            <Input
              label={t("investmentPeriod")}
              placeholder={t("periodTypePlaceholder")}
              error={errors.investmentPeriod?.message}
              {...register("investmentPeriod", {
                validate: (val) => {
                  if (!val || val.trim().length < 2) return "Period name is required";
                  if (configuredPeriods.has(val.trim().toLowerCase())) {
                    return `"${val.trim()}" already has a rate configured. Use Edit to change it.`;
                  }
                  return true;
                },
              })}
            />
            {/* Live duplicate warning — uses watched form value, no DOM query */}
            {isDuplicate && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>This period already exists. Click <strong>Edit ✏️</strong> on that row to change its rate.</span>
              </div>
            )}
          </div>
          <Input
            label={t("rateLabel")}
            type="number"
            step="0.1"
            min="0"
            placeholder={t("ratePlaceholder")}
            error={errors.ratePercentage?.message}
            {...register("ratePercentage", { valueAsNumber: true })}
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={closeModal}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isDuplicate}>
              <Check className="h-4 w-4 mr-1" /> {t("saveRate")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT modal — period locked, only rate is editable ────────────── */}
      <Modal
        open={modalMode === "edit"}
        onClose={closeModal}
        title={t("editTitle", { period: editTarget?.investmentPeriod ?? "" })}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Period is read-only in edit mode */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t("investmentPeriod")}
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-base">
              {editTarget?.investmentPeriod}
            </p>
            {/* Hidden field keeps period in form state for submission */}
            <input type="hidden" {...register("investmentPeriod")} />
          </div>
          <Input
            label={t("rateLabel")}
            type="number"
            step="0.1"
            min="0"
            placeholder={t("ratePlaceholder")}
            error={errors.ratePercentage?.message}
            {...register("ratePercentage", { valueAsNumber: true })}
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={closeModal}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Check className="h-4 w-4 mr-1" /> {t("saveRate")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── DELETE confirm modal ─────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("deleteConfirmTitle")}
      >
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          {t("deleteConfirmMessage", { period: deleteTarget?.investmentPeriod ?? "" })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" loading={deleting} onClick={confirmDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
