import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpsertRateDto } from './dto/upsert-rate.dto';

@Injectable()
export class InterestRatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  findAll() {
    return this.prisma.interestRate.findMany({
      orderBy: { investmentPeriod: 'asc' },
    });
  }

  async findByPeriod(period: string) {
    const rate = await this.prisma.interestRate.findUnique({
      where: { investmentPeriod: period },
    });
    if (!rate) throw new NotFoundException(`No rate configured for ${period}`);
    return rate;
  }

  async upsert(dto: UpsertRateDto, adminId: string) {
    const period = dto.investmentPeriod.trim();

    const existing = await this.prisma.interestRate.findUnique({
      where: { investmentPeriod: period },
    });

    const rate = await this.prisma.interestRate.upsert({
      where: { investmentPeriod: period },
      update: { ratePercentage: dto.ratePercentage },
      create: {
        investmentPeriod: period,
        ratePercentage: dto.ratePercentage,
      },
    });

    const action = existing ? 'UPDATE_INTEREST_RATE' : 'CREATE_INTEREST_RATE';
    const detail = existing
      ? `Updated "${period}" rate from ${existing.ratePercentage}% to ${dto.ratePercentage}%`
      : `Created "${period}" rate at ${dto.ratePercentage}%`;

    await this.auditLogs.log(adminId, action, detail, rate.id, 'interestRate');

    return rate;
  }

  async delete(period: string, adminId: string) {
    const existing = await this.prisma.interestRate.findUnique({
      where: { investmentPeriod: period },
    });
    if (!existing) throw new NotFoundException(`No rate configured for ${period}`);

    await this.prisma.interestRate.delete({ where: { investmentPeriod: period } });
    await this.auditLogs.log(
      adminId,
      'DELETE_INTEREST_RATE',
      `Deleted "${period}" interest rate`,
      existing.id,
      'interestRate',
    );
    return { message: `Interest rate for "${period}" deleted.` };
  }
}
