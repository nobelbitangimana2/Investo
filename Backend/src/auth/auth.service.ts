import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register (client self-registration) ───────────────────────────
  async register(dto: RegisterDto) {
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
        role: Role.CLIENT,
        clientProfile: {
          create: {
            firstName: dto.firstName ?? dto.name.split(' ')[0],
            lastName: dto.lastName ?? dto.name.split(' ').slice(1).join(' '),
            phone: dto.phone,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return user;
  }

  // ── Login ─────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is suspended');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        status: user.status,
      },
      ...tokens,
    };
  }

  // ── Refresh ───────────────────────────────────────────────────────
  async refresh(userId: string, email: string, role: Role, oldToken: string) {
    // Delete the old refresh token (rotation)
    await this.prisma.refreshToken.deleteMany({
      where: { token: oldToken },
    });
    return this.generateTokens(userId, email, role);
  }

  // ── Logout ────────────────────────────────────────────────────────
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // ── Internal helpers ──────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessOptions: JwtSignOptions = {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRY') ?? '15m') as JwtSignOptions['expiresIn'],
    };

    const refreshOptions: JwtSignOptions = {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRY') ?? '7d') as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, accessOptions),
      this.jwt.signAsync(payload, refreshOptions),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
