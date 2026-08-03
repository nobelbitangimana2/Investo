import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpsertRateDto } from './dto/upsert-rate.dto';
import { InvestmentPeriod } from '@prisma/client';

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

  async findByPeriod(period: InvestmentPeriod) {
    const rate = await this.prisma.interestRate.findUnique({
      where: { investmentPeriod: period },
    });
    if (!rate) throw new NotFoundException(`No rate configured for ${period}`);
    return rate;
  }

  async upsert(dto: UpsertRateDto, adminId: string) {
    const existing = await this.prisma.interestRate.findUnique({
      where: { investmentPeriod: dto.investmentPeriod },
    });

    const rate = await this.prisma.interestRate.upsert({
      where: { investmentPeriod: dto.investmentPeriod },
      update: { ratePercentage: dto.ratePercentage },
      create: {
        investmentPeriod: dto.investmentPeriod,
        ratePercentage: dto.ratePercentage,
      },
    });

    const action = existing ? 'UPDATE_INTEREST_RATE' : 'CREATE_INTEREST_RATE';
    const detail = existing
      ? `Updated ${dto.investmentPeriod} rate from ${existing.ratePercentage}% to ${dto.ratePercentage}%`
      : `Created ${dto.investmentPeriod} rate at ${dto.ratePercentage}%`;

    await this.auditLogs.log(adminId, action, detail, rate.id, 'interestRate');

    return rate;
  }
}
