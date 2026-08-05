"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { getDeposits, getWithdrawals, getClients, getInvestments } from "@/lib/mock-api";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvestoBarChart, InvestoPieChart } from "@/components/ui/charts";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { Deposit, Withdrawal, Investment } from "@/types";

export default function AccountantReportsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const canGenerate = useHasPermission("generateReports");
  const toast = useToast();

  useEffect(() => {
    Promise.all([getDeposits(), getWithdrawals(), getInvestments(), getClients()]).then(([d, w, i, c]) => {
      setDeposits(d);
      setWithdrawals(w);
      setInvestments(i);
      setClientCount(c.length);
    });
  }, []);

  const confirmedDeposits = deposits.filter((d) => d.status === "confirmed");
  const totalDepositAmount = confirmedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalInvested = activeInvestments.reduce((s, i) => s + i.amount, 0);

  const bankData = ["Bancobu", "BCB", "KCB", "Ecobank"].map((bank) => ({
    name: bank,
    value: confirmedDeposits.filter((d) => d.bank === bank).reduce((s, d) => s + d.amount, 0),
  })).filter((b) => b.value > 0);

  const periodData = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"].map((period) => ({
    period: period.replace(" ", "\n"),
    deposits: deposits.filter((d) => d.investmentPeriod === period).length,
  }));

  function mockExport(format: string) {
    if (!canGenerate) {
      toast.warning("You don't have permission to generate reports.");
      return;
    }
    toast.success(`Report exported as ${format} (mock — no actual file generated).`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Platform activity summary</p>
        </div>
        <div className="flex gap-2">
          {["PDF", "Excel", "CSV"].map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => mockExport(fmt)} disabled={!canGenerate}>
              <Download className="h-4 w-4" />
              {fmt}
            </Button>
          ))}
        </div>
      </div>

      {!canGenerate && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          You don&apos;t have permission to generate/export reports. Data is still visible.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clientCount} icon={FileText} />
        <StatCard title="Total Deposits (BIF)" value={formatCurrency(totalDepositAmount)} icon={FileText} />
        <StatCard title="Active Investments" value={activeInvestments.length} icon={FileText} />
        <StatCard title="Total Invested (BIF)" value={formatCurrency(totalInvested)} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Deposits by Investment Period</CardTitle></CardHeader>
          <CardContent>
            <InvestoBarChart
              data={periodData}
              xKey="period"
              bars={[{ key: "deposits", label: "Number of Deposits", color: "#0820ae" }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deposit Volume by Bank</CardTitle></CardHeader>
          <CardContent>
            <InvestoPieChart
              data={bankData}
              formatter={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Deposit Summary</CardTitle>
            <Button variant="outline" size="sm" onClick={() => mockExport("CSV")} disabled={!canGenerate}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Client", "Bank", "Amount", "Period", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deposits.slice(0, 10).map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{d.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">{d.bank}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{d.investmentPeriod}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        d.status === "confirmed" ? "text-emerald-600" :
                        d.status === "rejected" ? "text-red-600" : "text-amber-600"
                      }`}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
