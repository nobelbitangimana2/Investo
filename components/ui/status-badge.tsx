import { Badge } from "@/components/ui/badge";
import type { DepositStatus, WithdrawalStatus, InvestmentStatus } from "@/types";

interface StatusBadgeProps {
  status: DepositStatus | WithdrawalStatus | InvestmentStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  if (normalized === "confirmed") {
    return <Badge variant="success">Confirmed</Badge>;
  }
  if (normalized === "pending") {
    return <Badge variant="warning">Pending</Badge>;
  }
  if (normalized === "rejected") {
    return <Badge variant="destructive">Rejected</Badge>;
  }
  if (normalized === "active") {
    return <Badge variant="info">Active</Badge>;
  }
  if (normalized === "matured") {
    return <Badge variant="secondary">Matured</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}
