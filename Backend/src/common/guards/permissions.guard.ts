import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AccountantPermission, Role } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.getAllAndOverride<
      (keyof AccountantPermission)[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPerms || requiredPerms.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    const userRole = String(user.role ?? '').toUpperCase();

    // Admins always pass
    if (userRole === Role.ADMIN.toString()) return true;

    // For accountants, check their permission row
    if (userRole === Role.ACCOUNTANT.toString()) {
      const perms = await this.prisma.accountantPermission.findUnique({
        where: { userId: user.id },
      });
      if (!perms) throw new ForbiddenException('No permissions assigned');

      const hasAll = requiredPerms.every(
        (p) => (perms[p] as boolean) === true,
      );
      if (!hasAll) {
        throw new ForbiddenException(
          `Missing required permission(s): ${requiredPerms.join(', ')}`,
        );
      }
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
