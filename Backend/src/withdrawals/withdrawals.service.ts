import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestService } from '../investments/interest.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { FilterWithdrawalsDto } from './dto/filter-withdrawals.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Investment, WithdrawalStatus, InvestmentStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal allocation logic
// =============================================================================
// ORDERING DECISION (documented here per spec):
//
//   Status transitions:  PENDING → CONFIRMED (or REJECTED)
//
//   The ledger (principal/interest deduction) happens at CONFIRM time, NOT
//   at request time. This preserves reversibility: if an admin rejects a
//   pending request the investment balances are untouched. When confirmed,
//   the deduction is applied in a single Prisma transaction, guaranteeing
//   atomicity (all investments update or none do).
//
// RULE SUMMARY:
//   Single investment  → deduct interest first, then principal
//   Multiple investments → distribute proportionally by current value
//                          (currentPrincipal + accruedInterest), then apply
//                          interest-first rule per investment
// ─────────────────────────────────────────────────────────────────────────────

interface DeductionResult {
  investmentId: string;
  newPrincipal: number;
  newAccruedInterest: number;
  interestUsed: number;
  principalUsed: number;
}

/** Apply interest-first deduction to a single investment value */
function applyInterestFirst(
  principal: number,
  accruedInterest: number,
  withdrawalAmount: number,
): Omit<DeductionResult, 'investmentId'> {
  const interestUsed = Math.min(withdrawalAmount, accruedInterest);
  const remainingAfterInterest = withdrawalAmount - interestUsed;
  const principalUsed = Math.min(remainingAfterInterest, principal);
  return {
    newPrincipal: principal - principalUsed,
    newAccruedInterest: accruedInterest - interestUsed,
    interestUsed,
    principalUsed,
  };
}

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interest: InterestService,
    private readonly notifications: NotificationsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // ── Client: request withdrawal ────────────────────────────────────
  async create(clientId: string, dto: CreateWithdrawalDto) {
    // Validate the client has enough portfolio value before accepting request
    // Include ALL investments (active + matured) — as long as there is
    // remaining principal or accrued interest, the client can withdraw.
    const investments = await this.prisma.investment.findMany({
      where: { clientId },
    });

    const totalPortfolio = investments.reduce(
      (sum, inv) =>
        sum + parseFloat(inv.currentPrincipal.toString()) + parseFloat(inv.accruedInterest.toString()),
      0,
    );

    if (dto.amount > totalPortfolio) {
      throw new BadRequestException(
        `Requested amount (${dto.amount}) exceeds portfolio balance (${totalPortfolio.toFixed(2)})`,
      );
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        clientId,
        fullName: dto.fullName,
        bankToTransferTo: dto.bankToTransferTo,
        accountNumber: dto.accountNumber,
        recipientName: dto.recipientName,
        amount: dto.amount,
        status: WithdrawalStatus.PENDING,
      },
    });

    // Notify staff
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    const amountStr = dto.amount.toLocaleString();
    await this.notifications.notifyStaff(
      'Withdrawal Request',
      `${client?.name ?? 'A client'} requested a withdrawal of ${amountStr} BIF to ${dto.bankToTransferTo} — awaiting confirmation.`,
      'withdrawal',
    );

    return withdrawal;
  }

  // ── Admin/Accountant: list withdrawals ────────────────────────────
  async findAll(filters: FilterWithdrawalsDto) {
    const { page = 1, limit = 20, clientId, bank, status, from, to } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(clientId ? { clientId } : {}),
      ...(bank ? { bankToTransferTo: bank } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            requestedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        include: { client: { select: { id: true, name: true, email: true } } },
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return new PaginatedResponseDto(withdrawals, total, page, limit);
  }

  // ── Client: get own withdrawals ───────────────────────────────────
  async findMine(clientId: string, filters: FilterWithdrawalsDto) {
    return this.findAll({ ...filters, clientId });
  }

  // ── Get single withdrawal ─────────────────────────────────────────
  async findOne(id: string) {
    const w = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { client: { select: { id: true, name: true, email: true } } },
    });
    if (!w) throw new NotFoundException(`Withdrawal ${id} not found`);
    return w;
  }

  // ── Confirm withdrawal: apply ledger deductions ───────────────────
  async confirm(withdrawalId: string, confirmerId: string) {
    const withdrawal = await this.findOne(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be confirmed');
    }

    const requestedAmount = Number(withdrawal.amount);

    // Step 1: Refresh interest on all active investments for this client
    // Include ALL investments with remaining balance
    const activeInvestments = await this.prisma.investment.findMany({
      where: { clientId: withdrawal.clientId },
    });

    for (const inv of activeInvestments) {
      if (inv.status === InvestmentStatus.ACTIVE) {
        await this.interest.updateAccruedInterest(inv.id);
      }
    }

    // Re-fetch updated balances
    const refreshed = await this.prisma.investment.findMany({
      where: { clientId: withdrawal.clientId },
    });

    const totalPortfolio = refreshed.reduce(
      (sum, inv) =>
        sum + parseFloat(inv.currentPrincipal.toString()) + parseFloat(inv.accruedInterest.toString()),
      0,
    );

    if (requestedAmount > totalPortfolio) {
      throw new BadRequestException(
        `Insufficient portfolio balance. Available: ${totalPortfolio.toFixed(2)} BIF`,
      );
    }

    // Step 2 & 3: Calculate deductions per investment
    const deductions = this.calculateDeductions(refreshed, requestedAmount);

    // Step 4: Apply all updates atomically
    await this.prisma.$transaction([
      // Update withdrawal status
      this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: WithdrawalStatus.CONFIRMED, confirmedAt: new Date() },
      }),
      // Update each investment
      ...deductions.map((d) =>
        this.prisma.investment.update({
          where: { id: d.investmentId },
          data: {
            currentPrincipal: d.newPrincipal,
            accruedInterest: d.newAccruedInterest,
            lastInterestUpdate: new Date(),
          },
        }),
      ),
    ]);

    // Notifications + audit
    await this.notifications.create(
      withdrawal.clientId,
      'Withdrawal Confirmed',
      `Your withdrawal of ${requestedAmount.toLocaleString()} BIF to ${withdrawal.bankToTransferTo} has been confirmed.`,
      'withdrawal',
    );

    await this.auditLogs.log(
      confirmerId,
      'CONFIRM_WITHDRAWAL',
      `Confirmed withdrawal #${withdrawalId} for ${withdrawal.fullName} (${requestedAmount.toLocaleString()} BIF)`,
      withdrawalId,
      'withdrawal',
    );

    return this.findOne(withdrawalId);
  }

  // ── Reject withdrawal ─────────────────────────────────────────────
  async reject(
    withdrawalId: string,
    rejecterId: string,
    dto: RejectWithdrawalDto,
  ) {
    const withdrawal = await this.findOne(withdrawalId);
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be rejected');
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.REJECTED,
        rejectionNote: dto.rejectionNote,
        confirmedAt: new Date(),
      },
    });

    await this.notifications.create(
      withdrawal.clientId,
      'Withdrawal Rejected',
      `Your withdrawal request for ${Number(withdrawal.amount).toLocaleString()} BIF was rejected. Reason: ${dto.rejectionNote}`,
      'withdrawal',
    );

    await this.auditLogs.log(
      rejecterId,
      'REJECT_WITHDRAWAL',
      `Rejected withdrawal #${withdrawalId} for ${withdrawal.fullName}. Reason: ${dto.rejectionNote}`,
      withdrawalId,
      'withdrawal',
    );

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core proportional allocation algorithm
  // ─────────────────────────────────────────────────────────────────────────
  calculateDeductions(
    investments: Investment[],
    requestedAmount: number,
  ): DeductionResult[] {
    const totalPortfolio = investments.reduce(
      (sum, inv) =>
        sum + parseFloat(inv.currentPrincipal.toString()) + parseFloat(inv.accruedInterest.toString()),
      0,
    );

    if (investments.length === 0) return [];

    const results: DeductionResult[] = [];

    if (investments.length === 1) {
      const inv = investments[0];
      const deduction = applyInterestFirst(
        parseFloat(inv.currentPrincipal.toString()),
        parseFloat(inv.accruedInterest.toString()),
        requestedAmount,
      );
      results.push({ investmentId: inv.id, ...deduction });
    } else {
      const withdrawalRatio = requestedAmount / totalPortfolio;

      for (const inv of investments) {
        const currentValue =
          parseFloat(inv.currentPrincipal.toString()) + parseFloat(inv.accruedInterest.toString());
        const allocated = currentValue * withdrawalRatio;
        const deduction = applyInterestFirst(
          parseFloat(inv.currentPrincipal.toString()),
          parseFloat(inv.accruedInterest.toString()),
          allocated,
        );
        results.push({ investmentId: inv.id, ...deduction });
      }
    }

    return results;
  }
}
