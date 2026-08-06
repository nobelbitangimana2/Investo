"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserById, getClientProfile, getDeposits, getInvestments } from "@/lib/mock-api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { User, ClientProfile, Deposit, Investment } from "@/types";

export default function AccountantClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUserById(id), getClientProfile(id), getDeposits(id, false), getInvestments(id, false)])
      .then(([u, p, d, i]) => { setUser(u); setProfile(p); setDeposits(d); setInvestments(i); setLoading(false); });
  }, [id]);

  if (loading) return <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />;
  if (!user) return <p className="text-gray-400">Client not found.</p>;

  const confirmedDeposits = deposits.filter((d) => d.status === "confirmed");
  const totalDeposited = confirmedDeposits.reduce((s, d) => s + d.amount, 0);
  const activeInvestments = investments.filter((i) => i.status === "active");

  const depositCols: Column<Deposit>[] = [
    { key: "depositDate", header: "Date", cell: (r) => formatDate(r.depositDate) },
    { key: "bank", header: "Bank" },
    { key: "amount", header: "Amount", cell: (r) => formatCurrency(r.amount) },
    { key: "investmentPeriod", header: "Period" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const investCols: Column<Investment>[] = [
    { key: "amount", header: "Amount", cell: (r) => formatCurrency(r.amount) },
    { key: "investmentPeriod", header: "Period" },
    { key: "interestRate", header: "Rate", cell: (r) => `${r.interestRate}%` },
    { key: "expectedInterest", header: "Exp. Interest", cell: (r) => formatCurrency(r.expectedInterest) },
    { key: "maturityDate", header: "Matures", cell: (r) => formatDate(r.maturityDate) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Client Profile</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 rounded-2xl bg-navy-700 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-gray-500 text-sm">{user.email}</p>
              {profile && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-400 text-xs">Phone</span><p className="font-medium">{profile.phone}</p></div>
                  <div><span className="text-gray-400 text-xs">City</span><p className="font-medium">{profile.city}</p></div>
                  <div><span className="text-gray-400 text-xs">Bank</span><p className="font-medium">{profile.bankName}</p></div>
                  <div><span className="text-gray-400 text-xs">Joined</span><p className="font-medium">{formatDate(profile.joinedAt)}</p></div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-400">Total Deposited</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalDeposited)}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-400">Active Investments</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{activeInvestments.length}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-400">Expected Returns</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">
            {formatCurrency(activeInvestments.reduce((s, i) => s + i.expectedMaturityValue, 0))}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Deposit History</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={deposits} columns={depositCols} searchable={false} pageSize={5} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Investments</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={investments} columns={investCols} searchable={false} pageSize={5} />
        </CardContent>
      </Card>
    </div>
  );
}
