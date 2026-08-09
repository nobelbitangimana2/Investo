import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateAccountantDto } from './dto/create-accountant.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role, UserStatus } from '@prisma/client';

const SALT_ROUNDS = 12;

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePicture: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── List all users (admin) ─────────────────────────────────────────
  async findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT });
  }

  // ── Find by id ────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...USER_SELECT, accountantPermission: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  // ── List accountants ──────────────────────────────────────────────
  async findAccountants() {
    return this.prisma.user.findMany({
      where: { role: Role.ACCOUNTANT },
      select: { ...USER_SELECT, accountantPermission: true },
    });
  }

  // ── Create accountant (admin only) ────────────────────────────────
  async createAccountant(dto: CreateAccountantDto, adminId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: Role.ACCOUNTANT,
        accountantPermission: { create: {} }, // all false by default
      },
      select: { ...USER_SELECT, accountantPermission: true },
    });

    await this.auditLogs.log(
      adminId,
      'CREATE_ACCOUNTANT',
      `Created accountant account for ${dto.name} (${dto.email})`,
      user.id,
      'accountant',
    );

    return user;
  }

  // ── Update status (suspend / reactivate) ──────────────────────────
  async updateStatus(
    id: string,
    status: UserStatus,
    adminId: string,
  ) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: USER_SELECT,
    });

    await this.auditLogs.log(
      adminId,
      status === UserStatus.SUSPENDED ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      `${status === UserStatus.SUSPENDED ? 'Suspended' : 'Reactivated'} user ${user.name}`,
      id,
      'accountant',
    );

    return updated;
  }

  // ── Change own password (any role) ───────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { message: 'Password updated successfully' };
  }

  // ── Upload own avatar (any role) ──────────────────────────────────
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const url = await this.cloudinary.upload(file, 'avatars');
    await this.prisma.user.update({ where: { id: userId }, data: { profilePicture: url } });
    return { profilePicture: url };
  }

  // ── Update own contact info (any role) ────────────────────────────
  async updateContact(userId: string, dto: UpdateContactDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        province: dto.province,
      },
      select: { id: true, phone: true, address: true, city: true, province: true },
    });
    return user;
  }

  // ── Get own profile (any role) ────────────────────────────────────
  async getMyProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true,
        profilePicture: true, status: true,
        phone: true, address: true, city: true, province: true,
      },
    });
  }
  async updatePermissions(
    accountantId: string,
    dto: UpdatePermissionsDto,
    adminId: string,
  ) {
    const user = await this.findOne(accountantId);
    if (user.role !== Role.ACCOUNTANT) {
      throw new ConflictException('Target user is not an accountant');
    }

    const perms = await this.prisma.accountantPermission.upsert({
      where: { userId: accountantId },
      update: dto,
      create: { userId: accountantId, ...dto },
    });

    await this.auditLogs.log(
      adminId,
      'UPDATE_PERMISSIONS',
      `Updated permissions for ${user.name}: ${JSON.stringify(dto)}`,
      accountantId,
      'accountant',
    );

    return perms;
  }
}
