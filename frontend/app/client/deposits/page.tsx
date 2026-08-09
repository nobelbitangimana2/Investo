"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getDeposits } from "@/lib/mock-api";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Deposit } from "@/types";

export default function ClientDepositsPage() {
  const { user } = useAuthStore();
  const t = useTranslations("client.deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState<Deposit | null>(null);

  useEffect(() => {
    if (!user) return;
    getDeposits(user.id, true).then((d) => {
      setDeposits(d);
      setLoading(false);
    });
  }, [user]);

  const columns: Column<Deposit>[] = [
    { key: "depositDate", header: t("colDate"), sortable: true, cell: (r) => formatDate(r.depositDate) },
    { key: "bank", header: t("colBank"), sortable: true },
    { key: "accountNumber", header: t("colAccount") },
    {
      key: "amount",
      header: t("colAmount"),
      sortable: true,
      cell: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span>,
    },
    { key: "investmentPeriod", header: t("colPeriod"), sortable: true },
    { key: "referenceNumber", header: t("colReference") },
    { key: "status", header: t("colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "rejectionNote",
      header: t("colNote"),
      cell: (r) =>
        r.rejectionNote ? (
          <span
            className="text-xs text-red-600 max-w-[150px] block truncate"
            title={r.rejectionNote}
          >
            {r.rejectionNote}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: "id",
      header: "",
      cell: (r) => (
        <Button size="icon-sm" variant="ghost" onClick={() => setViewTarget(r)} aria-label="View">
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("totalDeposits", { count: deposits.length })}</p>
        </div>
        <Link href="/client/deposits/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t("newDeposit")}
          </Button>
        </Link>
      </div>

      <DataTable
        data={deposits}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder={t("searchPlaceholder")}
        searchKeys={["bank", "referenceNumber", "status"]}
        emptyMessage={t("noDeposits")}
      />

      {viewTarget && (
        <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={t("detailTitle")}>
          <div className="space-y-4 text-sm">
            {viewTarget.receiptUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <p className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
                  {t("receiptLabel")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewTarget.receiptUrl}
                  alt="Deposit receipt"
                  className="w-full max-h-64 object-contain bg-white"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="space-y-3">
              {([
                [t("fieldBank"), viewTarget.bank],
                [t("fieldAccount"), viewTarget.accountNumber],
                [t("fieldAmount"), formatCurrency(viewTarget.amount)],
                [t("fieldDate"), formatDate(viewTarget.depositDate)],
                [t("fieldReference"), viewTarget.referenceNumber],
                [t("fieldPeriod"), viewTarget.investmentPeriod],
                [t("fieldStatus"), viewTarget.status],
                [t("fieldSubmitted"), formatDateTime(viewTarget.submittedAt)],
                viewTarget.verifiedAt
                  ? [t("fieldVerified"), formatDateTime(viewTarget.verifiedAt)]
                  : null,
                viewTarget.rejectionNote
                  ? [t("fieldRejectionNote"), viewTarget.rejectionNote]
                  : null,
              ] as ([string, string] | null)[])
                .filter((x): x is [string, string] => x !== null)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-800 text-right">{v}</span>
                  </div>
                ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
