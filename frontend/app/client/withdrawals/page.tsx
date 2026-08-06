"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getWithdrawals } from "@/lib/mock-api";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Withdrawal } from "@/types";

export default function ClientWithdrawalsPage() {
  const { user } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getWithdrawals(user.id, true).then((w) => { setWithdrawals(w); setLoading(false); });
  }, [user]);

  const columns: Column<Withdrawal>[] = [
    { key: "requestedAt", header: "Date", sortable: true, cell: (r) => formatDate(r.requestedAt) },
    { key: "bankToTransferTo", header: "Bank", sortable: true },
    { key: "accountNumber", header: "Account" },
    { key: "recipientName", header: "Recipient" },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (r) => <span className="font-semibold">{formatCurrency(r.amount)}</span>,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "rejectionNote",
      header: "Note",
      cell: (r) =>
        r.rejectionNote ? (
          <span className="text-xs text-red-600 max-w-[150px] block truncate" title={r.rejectionNote}>
            {r.rejectionNote}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Withdrawals</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{withdrawals.length} total requests</p>
        </div>
        <Link href="/client/withdrawals/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <DataTable
        data={withdrawals}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder="Search withdrawals..."
        searchKeys={["bankToTransferTo", "recipientName", "status"]}
        emptyMessage="No withdrawal requests yet."
      />
    </div>
  );
}
