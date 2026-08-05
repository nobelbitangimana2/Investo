"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getDeposits, getWithdrawals, getInvestments, getClients } from "@/lib/mock-api";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvestoBarChart, InvestoPieChart, InvestoLineChart } from "@/components/ui/charts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PiggyBank, TrendingUp, Users, DollarSign } from "lucide-react";
import type { Deposit, Investment, User } from "@/types";

type ReportTab = "deposits" | "investments" | "clients";

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>("deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const toast = useToast();

  useEffect(() => {
    Promise.all([getDeposits(), getInvestments(), getClients()]).then(([d, i, c]) => {
      setDeposits(d);
      setInvestments(i);
      setClients(c);
    });
  }, []);

  function mockExport(format: string) {
    toast.success(`Exporting ${tab} report as ${format} — mock action.`);
  }

  const confirmedDeposits = deposits.filter((d) => d.status === "confirmed");
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeInvestments = investments.filter((i) => i.status === "active");
  const totalExpectedInterest = activeInvestments.reduce((s, i) => s + i.expectedInterest, 0);
  const totalMaturityValue = activeInvestments.reduce((s, i) => s + i.expectedMaturityValue, 0);

  const monthlyDeposits = [
    { month: "Jan", amount: 15000000, count: 3 },
    { month: "Feb", amount: 12000000, count: 2 },
    { month: "Mar", amount: 18000000, count: 4 },
    { month: "Apr", amount: 10000000, count: 2 },
    { month: "May", amount: 22000000, count: 5 },
    { month: "Jun", amount: 28000000, count: 6 },
  ];

  const periodData = ["Weekly", "Monthly", "3 Months", "6 Months", "1 Year", "5 Years"].map((p) => ({
    name: p,
    value: investments.filter((i) => i.investmentPeriod === p).length,
  })).filter((x) => x.value > 0);

  const depositColumns: Column<Deposit>[] = [
    { key: "depositDate", header: "Date", sortable: true, cell: (r) => formatDate(r.depositDate) },
    { key: "fullName", header: "Client", sortable: true },
    { key: "bank", header: "Bank", sortable: true },
    { key: "amount", header: "Amount", sortable: true, cell: (r) => formatCurrency(r.amount) },
    { key: "investmentPeriod", header: "Period" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const investmentColumns: Column<Investment>[] = [
    { key: "amount", header: "Principal", sortable: true, cell: (r) => formatCurrency(r.amount) },
    { key: "investmentPeriod", header: "Period", sortable: true },
    { key: "interestRate", header: "Rate", cell: (r) => `${r.interestRate}%` },
    { key: "expectedInterest", header: "Exp. Interest", cell: (r) => formatCurrency(r.expectedInterest) },
    { key: "expectedMaturityValue", header: "Maturity Value", cell: (r) => formatCurrency(r.expectedMaturityValue) },
    { key: "maturityDate", header: "Matures", cell: (r) => formatDate(r.maturityDate) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Comprehensive platform analytics</p>
        </div>
        <div className="flex gap-2">
          {["PDF", "Excel", "CSV"].map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => mockExport(fmt)}>
              <Download className="h-4 w-4" /> {fmt}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={clients.length} icon={Users} />
        <StatCard title="Total Deposited" value={formatCurrency(totalDeposited)} icon={PiggyBank} />
        <StatCard title="Expected Interest" value={formatCurrency(totalExpectedInterest)} icon={DollarSign} iconClassName="bg-amber-50" />
        <StatCard title="Total Maturity Value" value={formatCurrency(totalMaturityValue)} icon={TrendingUp} iconClassName="bg-emerald-50" />
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["deposits", "investments", "clients"] as ReportTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-navy-700 text-navy-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "deposits" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Monthly Deposit Volume</CardTitle></CardHeader>
              <CardContent>
                <InvestoBarChart
                  data={monthlyDeposits}
                  xKey="month"
                  bars={[{ key: "count", label: "Number of Deposits", color: "#0820ae" }]}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Monthly Deposit Amount (BIF)</CardTitle></CardHeader>
              <CardContent>
                <InvestoLineChart
                  data={monthlyDeposits}
                  xKey="month"
                  lines={[{ key: "amount", label: "Amount (BIF)", color: "#10b981" }]}
                  yFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
              </CardContent>
            </Card>
          </div>
          <DataTable data={deposits} columns={depositColumns} searchable
            searchKeys={["fullName", "bank", "status"]} searchPlaceholder="Search deposits..." />
        </div>
      )}

      {tab === "investments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Period Distribution</CardTitle></CardHeader>
              <CardContent><InvestoPieChart data={periodData} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Active vs Matured</CardTitle></CardHeader>
              <CardContent>
                <InvestoPieChart
                  data={[
                    { name: "Active", value: activeInvestments.length },
                    { name: "Matured", value: investments.filter(i => i.status === "matured").length },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
          <DataTable data={investments} columns={investmentColumns} searchable
            searchKeys={["investmentPeriod", "status"]} searchPlaceholder="Search investments..." />
        </div>
      )}

      {tab === "clients" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Client List</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Name", "Email", "Status", "Joined"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.email}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
