import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: string,
    details: string,
    targetId?: string,
    targetType?: string,
  ) {
    return this.prisma.auditLog.create({
      data: { userId, action, details, targetId, targetType },
    });
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      userId?: string;
      action?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.action
        ? { action: { contains: filters.action, mode: 'insensitive' as const } }
        : {}),
      ...(filters?.from || filters?.to
        ? {
            timestamp: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return new PaginatedResponseDto(logs, total, page, limit);
  }
}
