import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Role } from '@prisma/client';

const CLIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePicture: true,
  status: true,
  createdAt: true,
  clientProfile: true,
} as const;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── List clients (admin/accountant, searchable + paginated) ───────
  async findAll(pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where = {
      role: Role.CLIENT,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: CLIENT_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponseDto(users, total, page, limit);
  }

  // ── Get single client profile + history ───────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, role: Role.CLIENT },
      include: {
        clientProfile: true,
        deposits: {
          orderBy: { submittedAt: 'desc' },
        },
        investments: {
          orderBy: { createdAt: 'desc' },
        },
        withdrawals: {
          orderBy: { requestedAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException(`Client ${id} not found`);

    // Compute totals
    const confirmedDeposits = user.deposits.filter((d) => d.status === 'CONFIRMED');
    const totalDeposited = confirmedDeposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    const activeInvestments = user.investments.filter((i) => i.status === 'ACTIVE');
    const totalBalance = activeInvestments.reduce(
      (sum, i) => sum + Number(i.currentPrincipal) + Number(i.accruedInterest),
      0,
    );
    const totalExpectedInterest = activeInvestments.reduce(
      (sum, i) =>
        sum + (Number(i.originalPrincipal) * Number(i.interestRate)),
      0,
    );

    return {
      ...user,
      stats: {
        totalDeposited,
        totalBalance,
        totalExpectedInterest,
        activeInvestments: activeInvestments.length,
      },
    };
  }

  // ── Update own profile (client) ───────────────────────────────────
  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    let profilePicture: string | undefined;
    if (file) {
      profilePicture = await this.cloudinary.upload(file, 'avatars');
      await this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture },
      });
    }

    const profile = await this.prisma.clientProfile.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        ...dto,
      },
    });

    return { profile, ...(profilePicture ? { profilePicture } : {}) };
  }

  // ── Get own profile (client) ──────────────────────────────────────
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: CLIENT_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Ownership check helper ────────────────────────────────────────
  assertOwnership(resourceUserId: string, requesterId: string, role: Role) {
    if (role === Role.ADMIN || role === Role.ACCOUNTANT) return;
    if (resourceUserId !== requesterId) {
      throw new ForbiddenException('Access denied to this resource');
    }
  }
}
