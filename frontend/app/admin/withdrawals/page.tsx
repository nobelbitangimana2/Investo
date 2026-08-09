"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { getWithdrawals, confirmWithdrawal, rejectWithdrawal } from "@/lib/mock-api";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmRejectModal } from "@/components/ui/confirm-reject-modal";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { Withdrawal } from "@/types";

export default function AdminWithdrawalsPage() {
  const t = useTranslations("admin.withdrawals");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState<{ w: Withdrawal; action: "confirm" | "reject" } | null>(null);
  const [viewTarget, setViewTarget] = useState<Withdrawal | null>(null);
  const toast = useToast();

  useEffect(() => {
    getWithdrawals().then((w) => { setWithdrawals(w); setLoading(false); });
  }, []);

  async function handleAction(note?: string) {
    if (!actionTarget) return;
    const { w, action } = actionTarget;
    if (action === "confirm") {
      const updated = await confirmWithdrawal(w.id);
      setWithdrawals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(t("withdrawalConfirmed"));
    } else {
      const updated = await rejectWithdrawal(w.id, note ?? "");
      setWithdrawals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(t("withdrawalRejected"));
    }
  }

  const columns: Column<Withdrawal>[] = [
    { key: "requestedAt", header: "Date", sortable: true, cell: (r) => formatDate(r.requestedAt) },
    { key: "fullName", header: "Client", sortable: true },
    { key: "bankToTransferTo", header: "Bank", sortable: true },
    { key: "accountNumber", header: "Account" },
    { key: "recipientName", header: "Recipient" },
    { key: "amount", header: "Amount", sortable: true, cell: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
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
                onClick={() => setActionTarget({ w: r, action: "confirm" })}>
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                onClick={() => setActionTarget({ w: r, action: "reject" })}>
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
      <DataTable data={withdrawals} columns={columns} loading={loading} searchable
        searchPlaceholder={t("searchPlaceholder")} searchKeys={["fullName", "bankToTransferTo", "recipientName", "status"]} />
      {actionTarget && (
        <ConfirmRejectModal open={!!actionTarget} onClose={() => setActionTarget(null)}
          action={actionTarget.action}
          targetLabel={`withdrawal of ${formatCurrency(actionTarget.w.amount)} for ${actionTarget.w.fullName}`}
          onConfirm={handleAction} />
      )}
      {viewTarget && (
        <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={t("detailTitle")}>
          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              {([
                [t("fieldClient"), viewTarget.fullName], [t("fieldBank"), viewTarget.bankToTransferTo],
                [t("fieldAccount"), viewTarget.accountNumber], [t("fieldRecipient"), viewTarget.recipientName],
                [t("fieldAmount"), formatCurrency(viewTarget.amount)], [t("fieldStatus"), viewTarget.status],
                [t("fieldRequested"), formatDateTime(viewTarget.requestedAt)],
                viewTarget.confirmedAt ? [t("fieldProcessed"), formatDateTime(viewTarget.confirmedAt)] : null,
                viewTarget.rejectionNote ? [t("fieldRejectionNote"), viewTarget.rejectionNote] : null,
              ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-800 text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold text-blue-800">{t("processingRules")}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t("ruleInterestFirst")}</li>
                <li>{t("ruleProportional")}</li>
                <li>{t("ruleFutureCalc")}</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
