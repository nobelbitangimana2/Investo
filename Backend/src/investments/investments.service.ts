import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InterestService } from './interest.service';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Role, InvestmentStatus } from '@prisma/client';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interest: InterestService,
  ) {}

  // ── Client: get own investments ───────────────────────────────────
  async findMine(clientId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { deposit: { select: { bank: true, referenceNumber: true } } },
      }),
      this.prisma.investment.count({ where: { clientId } }),
    ]);

    // Enrich with live maturity value
    const enriched = investments.map((inv) => ({
      ...inv,
      currentBalance: parseFloat(inv.currentPrincipal.toString()) + parseFloat(inv.accruedInterest.toString()),
      projectedMaturityValue: this.interest.calculateMaturityValue(inv),
    }));

    return new PaginatedResponseDto(enriched, total, page, limit);
  }

  // ── Admin/Accountant: get all investments ─────────────────────────
  async findAll(
    pagination: PaginationDto,
    filters?: { clientId?: string; status?: InvestmentStatus },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    const where = {
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    };

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, email: true } },
          deposit: { select: { bank: true, referenceNumber: true } },
        },
      }),
      this.prisma.investment.count({ where }),
    ]);

    return new PaginatedResponseDto(investments, total, page, limit);
  }

  // ── Get single investment ─────────────────────────────────────────
  async findOne(id: string, requesterId: string, requesterRole: Role) {
    const inv = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        deposit: true,
      },
    });
    if (!inv) throw new NotFoundException(`Investment ${id} not found`);

    if (requesterRole === Role.CLIENT && inv.clientId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...inv,
      currentBalance: Number(inv.currentPrincipal) + Number(inv.accruedInterest),
      projectedMaturityValue: this.interest.calculateMaturityValue(inv),
    };
  }
}
