import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Internal: create notification ─────────────────────────────────
  async create(userId: string, title: string, message: string, type = 'system') {
    return this.prisma.notification.create({
      data: { userId, title, message, type },
    });
  }

  // ── Notify all admin + accountant users ───────────────────────────
  async notifyStaff(title: string, message: string, type = 'system') {
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'ACCOUNTANT'] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    await this.prisma.notification.createMany({
      data: staff.map((s) => ({ userId: s.id, title, message, type })),
    });
  }

  // ── Get own notifications ─────────────────────────────────────────
  async findMine(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return new PaginatedResponseDto(notifications, total, page, limit);
  }

  // ── Mark one as read ──────────────────────────────────────────────
  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.userId !== userId) throw new ForbiddenException();
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  // ── Mark all as read ──────────────────────────────────────────────
  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'All notifications marked as read' };
  }

  // ── Unread count ──────────────────────────────────────────────────
  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }
}
