"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { getDeposits, confirmDeposit, rejectDeposit } from "@/lib/mock-api";
import { useAuthStore } from "@/lib/auth-store";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmRejectModal } from "@/components/ui/confirm-reject-modal";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Deposit } from "@/types";

export default function AdminDepositsPage() {
  const { user } = useAuthStore();
  const t = useTranslations("admin.deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{ deposit: Deposit; action: "confirm" | "reject" } | null>(null);
  const [viewTarget, setViewTarget] = useState<Deposit | null>(null);
  const toast = useToast();

  useEffect(() => {
    getDeposits().then((d) => { setDeposits(d); setLoading(false); });
  }, []);

  async function handleAction(note?: string) {
    if (!actionTarget || !user) return;
    const { deposit, action } = actionTarget;
    if (action === "confirm") {
      const updated = await confirmDeposit(deposit.id, user.id);
      setDeposits((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success(t("depositConfirmed"));
    } else {
      const updated = await rejectDeposit(deposit.id, user.id, note ?? "");
      setDeposits((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success(t("depositRejected"));
    }
  }

  const columns: Column<Deposit>[] = [
    { key: "depositDate", header: "Date", sortable: true, cell: (r) => formatDate(r.depositDate) },
    { key: "fullName", header: "Client", sortable: true },
    { key: "bank", header: "Bank", sortable: true },
    { key: "amount", header: "Amount", sortable: true, cell: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: "investmentPeriod", header: "Period", sortable: true },
    { key: "referenceNumber", header: "Reference" },
    { key: "status", header: "Status", sortable: true, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "id",
      header: "Actions",
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <Button size="icon-sm" variant="ghost" onClick={() => setViewTarget(r)}><Eye className="h-4 w-4" /></Button>
          {r.status === "pending" && (
            <>
              <Button size="icon-sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50"
                onClick={() => setActionTarget({ deposit: r, action: "confirm" })}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                onClick={() => setActionTarget({ deposit: r, action: "reject" })}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
      </div>
      <DataTable data={deposits} columns={columns} loading={loading} searchable
        searchPlaceholder={t("searchPlaceholder")} searchKeys={["fullName", "bank", "referenceNumber", "status"]} />
      {actionTarget && (
        <ConfirmRejectModal open={!!actionTarget} onClose={() => setActionTarget(null)}
          action={actionTarget.action}
          targetLabel={`deposit of ${formatCurrency(actionTarget.deposit.amount)}`}
          onConfirm={handleAction} />
      )}
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
                [t("fieldClient"), viewTarget.fullName], [t("fieldBank"), viewTarget.bank],
                [t("fieldAccount"), viewTarget.accountNumber], [t("fieldAmount"), formatCurrency(viewTarget.amount)],
                [t("fieldDate"), formatDate(viewTarget.depositDate)], [t("fieldReference"), viewTarget.referenceNumber],
                [t("fieldPeriod"), viewTarget.investmentPeriod], [t("fieldStatus"), viewTarget.status],
                [t("fieldSubmitted"), formatDateTime(viewTarget.submittedAt)],
                viewTarget.verifiedAt ? [t("fieldVerified"), formatDateTime(viewTarget.verifiedAt)] : null,
                viewTarget.rejectionNote ? [t("fieldRejectionNote"), viewTarget.rejectionNote] : null,
              ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
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
