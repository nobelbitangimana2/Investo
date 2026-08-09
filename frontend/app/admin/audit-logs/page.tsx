"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getAuditLogs } from "@/lib/mock-api";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { AuditLogEntry } from "@/types";

const roleColors: Record<string, "default" | "info" | "success" | "warning"> = {
  admin: "default",
  accountant: "info",
  client: "success",
};

const actionColors: Record<string, string> = {
  CONFIRM_DEPOSIT: "text-emerald-700 bg-emerald-50",
  REJECT_DEPOSIT: "text-red-700 bg-red-50",
  CONFIRM_WITHDRAWAL: "text-emerald-700 bg-emerald-50",
  REJECT_WITHDRAWAL: "text-red-700 bg-red-50",
  CREATE_ACCOUNTANT: "text-blue-700 bg-blue-50",
  UPDATE_INTEREST_RATE: "text-amber-700 bg-amber-50",
  UPDATE_PERMISSIONS: "text-purple-700 bg-purple-50",
};

export default function AdminAuditLogsPage() {
  const t = useTranslations("admin.auditLogs");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then((l) => { setLogs(l); setLoading(false); });
  }, []);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "timestamp",
      header: t("colTimestamp"),
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(r.timestamp)}</span>
      ),
    },
    {
      key: "userName",
      header: t("colUser"),
      sortable: true,
      cell: (r) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{r.userName}</p>
          <Badge variant={roleColors[r.userRole] ?? "secondary"} className="text-xs mt-0.5">
            {r.userRole}
          </Badge>
        </div>
      ),
    },
    {
      key: "action",
      header: t("colAction"),
      sortable: true,
      cell: (r) => (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${actionColors[r.action] ?? "text-gray-700 bg-gray-100"}`}>
          {r.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "details",
      header: t("colDetails"),
      cell: (r) => (
        <span className="text-sm text-gray-600 max-w-xs block" title={r.details}>
          {r.details.length > 80 ? r.details.slice(0, 80) + "…" : r.details}
        </span>
      ),
    },
    {
      key: "targetType",
      header: t("colRole"),
      cell: (r) => r.targetType ? (
        <span className="text-xs text-gray-400 capitalize">{r.targetType}</span>
      ) : <span className="text-gray-200">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
      </div>

      {logs.length === 0 && !loading ? (
        <div className="py-16 text-center text-gray-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No audit logs found.</p>
        </div>
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder={t("searchPlaceholder")}
          searchKeys={["userName", "action", "details", "userRole"]}
          pageSize={15}
        />
      )}
    </div>
  );
}
