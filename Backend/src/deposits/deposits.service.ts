import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InterestRatesService } from '../interest-rates/interest-rates.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { RejectDepositDto } from './dto/reject-deposit.dto';
import { FilterDepositsDto } from './dto/filter-deposits.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { DepositStatus, InvestmentPeriod } from '@prisma/client';

// ── Maturity date calculator ───────────────────────────────────────────────
function computeMaturityDate(from: Date, period: InvestmentPeriod): Date {
  const d = new Date(from);
  switch (period) {
    case InvestmentPeriod.WEEKLY:        d.setDate(d.getDate() + 7);      break;
    case InvestmentPeriod.MONTHLY:       d.setMonth(d.getMonth() + 1);    break;
    case InvestmentPeriod.THREE_MONTHS:  d.setMonth(d.getMonth() + 3);    break;
    case InvestmentPeriod.SIX_MONTHS:    d.setMonth(d.getMonth() + 6);    break;
    case InvestmentPeriod.ONE_YEAR:      d.setFullYear(d.getFullYear() + 1); break;
    case InvestmentPeriod.FIVE_YEARS:    d.setFullYear(d.getFullYear() + 5); break;
  }
  return d;
}

@Injectable()
export class DepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly notifications: NotificationsService,
    private readonly auditLogs: AuditLogsService,
    private readonly rates: InterestRatesService,
  ) {}

  // ── Client: submit deposit ─────────────────────────────────────────
  async create(
    clientId: string,
    dto: CreateDepositDto,
    file?: Express.Multer.File,
  ) {
    let receiptUrl: string | undefined;
    if (file) {
      receiptUrl = await this.cloudinary.upload(file, 'receipts');
    }

    const deposit = await this.prisma.deposit.create({
      data: {
        clientId,
        fullName: dto.fullName,
        bank: dto.bank,
        accountNumber: dto.accountNumber,
        amount: dto.amount,
        depositDate: new Date(dto.depositDate),
        investmentPeriod: dto.investmentPeriod,
        referenceNumber: dto.referenceNumber,
        receiptUrl,
        status: DepositStatus.PENDING,
      },
    });

    // Notify all staff of new pending deposit
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    });
    const amountStr = Number(deposit.amount).toLocaleString();
    await this.notifications.notifyStaff(
      'New Deposit Submitted',
      `${client?.name ?? 'A client'} submitted a deposit of ${amountStr} BIF (${dto.investmentPeriod}) — pending review.`,
      'deposit',
    );

    return deposit;
  }

  // ── Client: get own deposits ───────────────────────────────────────
  async findMine(clientId: string, filters: FilterDepositsDto) {
    return this.findAll({ ...filters, clientId });
  }

  // ── Admin/Accountant: get all deposits (filtered) ─────────────────
  async findAll(filters: FilterDepositsDto) {
    const { page = 1, limit = 20, clientId, bank, status, investmentPeriod, from, to, search } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(clientId ? { clientId } : {}),
      ...(bank ? { bank } : {}),
      ...(status ? { status } : {}),
      ...(investmentPeriod ? { investmentPeriod } : {}),
      ...(from || to
        ? { depositDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { referenceNumber: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        include: { client: { select: { id: true, name: true, email: true } } },
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return new PaginatedResponseDto(deposits, total, page, limit);
  }

  // ── Get single deposit ────────────────────────────────────────────
  async findOne(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } },
        investment: true,
      },
    });
    if (!deposit) throw new NotFoundException(`Deposit ${id} not found`);
    return deposit;
  }

  // ── Confirm deposit (with full transaction) ───────────────────────
  async confirm(depositId: string, verifierId: string) {
    const deposit = await this.findOne(depositId);
    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Only pending deposits can be confirmed');
    }

    // Look up the current interest rate for this period
    const rateRecord = await this.rates.findByPeriod(deposit.investmentPeriod);
    const interestRate = Number(rateRecord.ratePercentage) / 100; // store as decimal fraction

    const now = new Date();
    const maturityDate = computeMaturityDate(now, deposit.investmentPeriod);
    const amount = Number(deposit.amount);

    const [updatedDeposit] = await this.prisma.$transaction([
      // 1. Confirm the deposit
      this.prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.CONFIRMED,
          verifiedById: verifierId,
          verifiedAt: now,
        },
      }),
      // 2. Create the investment
      this.prisma.investment.create({
        data: {
          clientId: deposit.clientId,
          depositId,
          originalPrincipal: amount,
          currentPrincipal: amount,
          accruedInterest: 0,
          interestRate,
          investmentPeriod: deposit.investmentPeriod,
          confirmationDate: now,
          maturityDate,
          lastInterestUpdate: now,
        },
      }),
    ]);

    // 3. Notify client (outside transaction — non-critical)
    await this.notifications.create(
      deposit.clientId,
      'Deposit Confirmed',
      `Your deposit of ${Number(deposit.amount).toLocaleString()} BIF has been confirmed. Your investment is now active.`,
      'deposit',
    );

    // 4. Notify all admins/accountants of the confirmation
    await this.notifications.notifyStaff(
      'Deposit Confirmed',
      `${deposit.fullName}'s deposit of ${Number(deposit.amount).toLocaleString()} BIF was confirmed.`,
      'deposit',
    );

    // 5. Audit log
    await this.auditLogs.log(
      verifierId,
      'CONFIRM_DEPOSIT',
      `Confirmed deposit #${depositId} for ${deposit.fullName} (${Number(deposit.amount).toLocaleString()} BIF)`,
      depositId,
      'deposit',
    );

    return updatedDeposit;
  }

  // ── Reject deposit ────────────────────────────────────────────────
  async reject(depositId: string, verifierId: string, dto: RejectDepositDto) {
    const deposit = await this.findOne(depositId);
    if (deposit.status !== DepositStatus.PENDING) {
      throw new BadRequestException('Only pending deposits can be rejected');
    }

    const updated = await this.prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: DepositStatus.REJECTED,
        rejectionNote: dto.rejectionNote,
        verifiedById: verifierId,
        verifiedAt: new Date(),
      },
    });

    await this.notifications.create(
      deposit.clientId,
      'Deposit Rejected',
      `Your deposit of ${Number(deposit.amount).toLocaleString()} BIF was rejected. Reason: ${dto.rejectionNote}`,
      'deposit',
    );

    await this.notifications.notifyStaff(
      'Deposit Rejected',
      `${deposit.fullName}'s deposit of ${Number(deposit.amount).toLocaleString()} BIF was rejected.`,
      'deposit',
    );

    await this.auditLogs.log(
      verifierId,
      'REJECT_DEPOSIT',
      `Rejected deposit #${depositId} for ${deposit.fullName}. Reason: ${dto.rejectionNote}`,
      depositId,
      'deposit',
    );

    return updated;
  }
}
