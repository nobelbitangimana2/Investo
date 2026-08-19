"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import Image from "next/image";
import { getActivePartnerBanks } from "@/lib/mock-api";
import { useTranslations } from "next-intl";
import type { PartnerBank } from "@/types";

/**
 * Read-only view of active partner banks.
 * Used on the /client/banks and /accountant/banks pages.
 */
export function PartnerBanksView() {
  const t = useTranslations("partnerBanksPage");
  const [banks, setBanks] = useState<PartnerBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivePartnerBanks()
      .then(setBanks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{t("subtitle")}</p>
      </div>

      {/* Bank cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700" />
                <div className="h-5 w-28 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-700 rounded" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded mt-3" />
                <div className="h-5 w-40 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : banks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <Building2 className="h-12 w-12 mb-3 opacity-30" />
          <p>{t("noBanks")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Bank name + icon */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                  {bank.icon ? (
                    <Image
                      src={bank.icon}
                      alt={bank.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-base">
                  {bank.name}
                </span>
              </div>

              {/* Account details */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                    {t("accountName")}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {bank.accountName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                    {t("accountNumber")}
                  </p>
                  <p className="text-lg font-bold font-mono tracking-widest text-navy-700 dark:text-navy-300">
                    {bank.accountNumber}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
