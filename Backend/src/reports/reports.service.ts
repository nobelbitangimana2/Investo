import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DepositStatus, WithdrawalStatus, InvestmentStatus, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Combined dashboard ────────────────────────────────────────────
  async dashboard() {
    const [
      totalClients,
      depositStats,
      withdrawalStats,
      investmentStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.CLIENT } }),
      this.prisma.deposit.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.investment.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { currentPrincipal: true, accruedInterest: true },
      }),
    ]);

    const depositSummary = {
      total: depositStats.reduce((s, d) => s + d._count.id, 0),
      totalAmount: depositStats.reduce((s, d) => s + Number(d._sum.amount ?? 0), 0),
      byStatus: Object.fromEntries(
        depositStats.map((d) => [d.status, { count: d._count.id, amount: Number(d._sum.amount ?? 0) }]),
      ),
    };

    const withdrawalSummary = {
      total: withdrawalStats.reduce((s, w) => s + w._count.id, 0),
      totalAmount: withdrawalStats.reduce((s, w) => s + Number(w._sum.amount ?? 0), 0),
      byStatus: Object.fromEntries(
        withdrawalStats.map((w) => [w.status, { count: w._count.id, amount: Number(w._sum.amount ?? 0) }]),
      ),
    };

    const activeStat = investmentStats.find((i) => i.status === InvestmentStatus.ACTIVE);
    const investmentSummary = {
      activeCount: activeStat?._count.id ?? 0,
      activePrincipal: Number(activeStat?._sum.currentPrincipal ?? 0),
      activeAccruedInterest: Number(activeStat?._sum.accruedInterest ?? 0),
    };

    return {
      totalClients,
      deposits: depositSummary,
      withdrawals: withdrawalSummary,
      investments: investmentSummary,
    };
  }

  // ── Deposit report ────────────────────────────────────────────────
  async depositReport(from?: string, to?: string) {
    const dateFilter = from || to
      ? { depositDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {};

    const [byStatus, byBank, byPeriod, recent] = await Promise.all([
      this.prisma.deposit.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.deposit.groupBy({
        by: ['bank'],
        where: { ...dateFilter, status: DepositStatus.CONFIRMED },
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.deposit.groupBy({
        by: ['investmentPeriod'],
        where: { ...dateFilter, status: DepositStatus.CONFIRMED },
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Monthly trend (last 12 months)
      this.prisma.$queryRaw<{ month: string; count: bigint; total: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "depositDate"), 'YYYY-MM') as month,
               COUNT(*) as count,
               SUM(CAST(amount AS NUMERIC)) as total
        FROM "Deposit"
        WHERE status = 'CONFIRMED'
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      byStatus: byStatus.map((r) => ({
        label: r.status,
        count: r._count.id,
        amount: Number(r._sum.amount ?? 0),
      })),
      byBank: byBank.map((r) => ({
        label: r.bank,
        count: r._count.id,
        amount: Number(r._sum.amount ?? 0),
      })),
      byPeriod: byPeriod.map((r) => ({
        label: r.investmentPeriod,
        count: r._count.id,
        amount: Number(r._sum.amount ?? 0),
      })),
      trend: recent.map((r) => ({
        label: r.month,
        count: Number(r.count),
        amount: Number(r.total),
      })),
    };
  }

  // ── Investment report ─────────────────────────────────────────────
  async investmentReport() {
    const [byStatus, byPeriod, upcomingMaturities] = await Promise.all([
      this.prisma.investment.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { currentPrincipal: true, accruedInterest: true },
      }),
      this.prisma.investment.groupBy({
        by: ['investmentPeriod'],
        where: { status: InvestmentStatus.ACTIVE },
        _count: { id: true },
        _sum: { currentPrincipal: true },
      }),
      this.prisma.investment.findMany({
        where: {
          status: InvestmentStatus.ACTIVE,
          maturityDate: { gte: new Date() },
        },
        orderBy: { maturityDate: 'asc' },
        take: 20,
        select: {
          id: true,
          maturityDate: true,
          currentPrincipal: true,
          accruedInterest: true,
          investmentPeriod: true,
          client: { select: { name: true } },
        },
      }),
    ]);

    return {
      byStatus: byStatus.map((r) => ({
        label: r.status,
        count: r._count.id,
        principal: Number(r._sum.currentPrincipal ?? 0),
        accruedInterest: Number(r._sum.accruedInterest ?? 0),
      })),
      byPeriod: byPeriod.map((r) => ({
        label: r.investmentPeriod,
        count: r._count.id,
        principal: Number(r._sum.currentPrincipal ?? 0),
      })),
      upcomingMaturities: upcomingMaturities.map((inv) => ({
        ...inv,
        currentPrincipal: Number(inv.currentPrincipal),
        accruedInterest: Number(inv.accruedInterest),
        currentBalance: Number(inv.currentPrincipal) + Number(inv.accruedInterest),
      })),
    };
  }

  // ── Client report ─────────────────────────────────────────────────
  async clientReport() {
    const [totalClients, activeClients, topInvestors, monthlyGrowth] =
      await Promise.all([
        this.prisma.user.count({ where: { role: Role.CLIENT } }),
        this.prisma.user.count({ where: { role: Role.CLIENT, status: 'ACTIVE' } }),
        this.prisma.investment.groupBy({
          by: ['clientId'],
          where: { status: InvestmentStatus.ACTIVE },
          _sum: { currentPrincipal: true },
          orderBy: { _sum: { currentPrincipal: 'desc' } },
          take: 10,
        }),
        this.prisma.$queryRaw<{ month: string; new_clients: bigint }[]>`
          SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
                 COUNT(*) as new_clients
          FROM "User"
          WHERE role = 'CLIENT'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `,
      ]);

    // Enrich top investors with name
    const enriched = await Promise.all(
      topInvestors.map(async (inv) => {
        const user = await this.prisma.user.findUnique({
          where: { id: inv.clientId },
          select: { name: true, email: true },
        });
        return {
          clientId: inv.clientId,
          name: user?.name,
          email: user?.email,
          totalPrincipal: Number(inv._sum.currentPrincipal ?? 0),
        };
      }),
    );

    return {
      totalClients,
      activeClients,
      topInvestors: enriched,
      monthlyGrowth: monthlyGrowth.map((r) => ({
        label: r.month,
        value: Number(r.new_clients),
      })),
    };
  }

  // ── Withdrawal report ─────────────────────────────────────────────
  async withdrawalReport() {
    const byStatus = await this.prisma.withdrawal.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    const confirmedTotal = byStatus.find(
      (r) => r.status === WithdrawalStatus.CONFIRMED,
    );
    const pendingTotal = byStatus.find(
      (r) => r.status === WithdrawalStatus.PENDING,
    );

    return {
      byStatus: byStatus.map((r) => ({
        label: r.status,
        count: r._count.id,
        amount: Number(r._sum.amount ?? 0),
      })),
      summary: {
        totalConfirmed: Number(confirmedTotal?._sum.amount ?? 0),
        totalPending: Number(pendingTotal?._sum.amount ?? 0),
        pendingCount: pendingTotal?._count.id ?? 0,
      },
    };
  }
}
