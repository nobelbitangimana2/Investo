"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Check, X } from "lucide-react";
import { getInterestRates, upsertInterestRate } from "@/lib/mock-api";
import { interestRateSchema, type InterestRateFormValues } from "@/lib/zod-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { InterestRate } from "@/types";

const PERIODS = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"];

export default function AdminInterestRatesPage() {
  const t = useTranslations("admin.interestRates");
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<InterestRate | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InterestRateFormValues>({ resolver: zodResolver(interestRateSchema) });

  useEffect(() => {
    getInterestRates().then((r) => { setRates(r); setLoading(false); });
  }, []);

  function startEdit(rate: InterestRate) {
    setEditTarget(rate);
    setValue("investmentPeriod", rate.investmentPeriod);
    setValue("ratePercentage", rate.ratePercentage);
  }

  async function onSubmit(data: InterestRateFormValues) {
    const updated = await upsertInterestRate(data.investmentPeriod, data.ratePercentage);
    setRates((prev) => {
      const exists = prev.find((r) => r.investmentPeriod === updated.investmentPeriod);
      return exists
        ? prev.map((r) => (r.investmentPeriod === updated.investmentPeriod ? updated : r))
        : [...prev, updated];
    });
    toast.success(t("rateUpdated", { period: data.investmentPeriod, rate: data.ratePercentage }));
    setEditTarget(null);
    setShowAdd(false);
    reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={() => { reset(); setShowAdd(true); }}>
          <Pencil className="h-4 w-4" /> {t("addUpdate")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[t("colPeriod"), t("colRate"), t("colLastUpdated"), t("colActions")].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{rate.investmentPeriod}</td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-700 font-bold text-base">{rate.ratePercentage}%</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{formatDate(rate.dateUpdated)}</td>
                      <td className="px-6 py-4">
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(rate)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Rate Modal */}
      <Modal
        open={!!editTarget || showAdd}
        onClose={() => { setEditTarget(null); setShowAdd(false); reset(); }}
        title={editTarget ? t("editTitle", { period: editTarget.investmentPeriod }) : t("addTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {!editTarget && (
            <Controller
              name="investmentPeriod"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("investmentPeriod")}
                  placeholder={t("periodPlaceholder")}
                  options={PERIODS.map((p) => ({ value: p, label: p }))}
                  error={errors.investmentPeriod?.message}
                  {...field}
                />
              )}
            />
          )}
          <Input
            label={t("rateLabel")}
            type="number"
            step="0.1"
            placeholder={t("ratePlaceholder")}
            error={errors.ratePercentage?.message}
            {...register("ratePercentage", { valueAsNumber: true })}
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => { setEditTarget(null); setShowAdd(false); reset(); }}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Check className="h-4 w-4" /> {t("saveRate")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
