"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { getClients, getDeposits, getInvestments } from "@/lib/mock-api";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { User, Deposit, Investment } from "@/types";

export default function AdminClientsPage() {
  const t = useTranslations("admin.clients");
  const [clients, setClients] = useState<User[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClients(), getDeposits(), getInvestments()]).then(([c, d, i]) => {
      setClients(c);
      setDeposits(d);
      setInvestments(i);
      setLoading(false);
    });
  }, []);

  const filtered = clients.filter((c) =>
    query.trim()
      ? c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase())
      : true
  );

  function clientStats(clientId: string) {
    const clientDeposits = deposits.filter((d) => d.clientId === clientId && d.status === "confirmed");
    const clientInvestments = investments.filter((i) => i.clientId === clientId && i.status === "active");
    return {
      totalDeposited: clientDeposits.reduce((s, d) => s + d.amount, 0),
      activeInvestments: clientInvestments.length,
      expectedInterest: clientInvestments.reduce((s, i) => s + i.expectedInterest, 0),
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{t("subtitle")}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search clients"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>{t("noClients")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const stats = clientStats(client.id);
            return (
              <Link key={client.id} href={`/admin/clients/${client.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {getInitials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-400 truncate">{client.email}</p>
                      </div>
                      <StatusBadge status={client.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-400">{t("totalInvested")}</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">
                          {(stats.totalDeposited / 1_000_000).toFixed(1)}M BIF
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("activeInvestments")}</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">{stats.activeInvestments} inv.</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{t("expectedReturn")}</p>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                          {(stats.expectedInterest / 1_000_000).toFixed(1)}M BIF
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 mt-3">Joined {formatDate(client.createdAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
