import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Investment, InvestmentStatus } from '@prisma/client';

/**
 * Day-count convention: Actual/365 (ACT/365 Fixed).
 * Each calendar day earns:  currentPrincipal * (annualRate / 365)
 *
 * where annualRate is stored as a decimal fraction in the DB
 * (e.g. 35% → 0.3500).
 *
 * Interest accrues on the currentPrincipal only — NOT on previously
 * accrued interest (simple interest, not compound).
 *
 * principalchanges only via: deposit confirmation (increases) or
 * withdrawal deduction (decreases). See WithdrawalService for the
 * proportional-deduction logic.
 */
@Injectable()
export class InterestService {
  private readonly logger = new Logger(InterestService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Calculate daily interest for one investment ────────────────────
  calculateDailyInterest(investment: Investment): number {
    return (
      Number(investment.currentPrincipal) * (Number(investment.interestRate) / 365)
    );
  }

  // ── Update accrued interest for one investment ────────────────────
  async updateAccruedInterest(investmentId: string): Promise<Investment> {
    const inv = await this.prisma.investment.findUniqueOrThrow({
      where: { id: investmentId },
    });

    if (inv.status !== InvestmentStatus.ACTIVE) return inv;

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysElapsed = Math.floor(
      (now.getTime() - inv.lastInterestUpdate.getTime()) / msPerDay,
    );

    if (daysElapsed <= 0) return inv; // nothing to accrue

    const newInterest = this.calculateDailyInterest(inv) * daysElapsed;
    const newAccrued = Number(inv.accruedInterest) + newInterest;

    // Auto-mature if past maturity date
    const nowMatured = now >= inv.maturityDate;

    return this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        accruedInterest: newAccrued,
        lastInterestUpdate: now,
        ...(nowMatured ? { status: InvestmentStatus.MATURED } : {}),
      },
    });
  }

  // ── Calculate projected maturity value ────────────────────────────
  calculateMaturityValue(investment: Investment): number {
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToMaturity = Math.max(
      0,
      Math.floor((investment.maturityDate.getTime() - now.getTime()) / msPerDay),
    );
    const futureInterest =
      this.calculateDailyInterest(investment) * daysToMaturity;
    return (
      Number(investment.currentPrincipal) +
      Number(investment.accruedInterest) +
      futureInterest
    );
  }

  // ── Cron: daily at midnight — accrue interest for ALL active investments
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyAccrual() {
    this.logger.log('Running daily interest accrual job...');

    const active = await this.prisma.investment.findMany({
      where: { status: InvestmentStatus.ACTIVE },
      select: { id: true },
    });

    let updated = 0;
    for (const { id } of active) {
      try {
        await this.updateAccruedInterest(id);
        updated++;
      } catch (err) {
        this.logger.error(`Failed to update interest for investment ${id}`, err);
      }
    }

    this.logger.log(`Daily accrual done. Updated ${updated}/${active.length} investments.`);
  }
}
