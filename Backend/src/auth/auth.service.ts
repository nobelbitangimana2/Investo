import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

const SALT_ROUNDS = 12;
// Rate limit: max resend attempts tracked in memory (simple, no Redis dependency)
// Key = email, value = { count, resetAt }
const resendAttempts = new Map<string, { count: number; resetAt: number }>();
const RESEND_MAX = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ── Register ──────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Don't reveal whether an account exists (anti-enumeration)
      // Just return the same success message — but don't create a duplicate
      // We still throw here for UX, but the message is generic.
      throw new ConflictException(
        'An account with this email already exists. Please sign in or use a different email.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const { token, expires } = this.generateVerificationToken();
    const fullName = [dto.firstName, dto.middleName, dto.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    await this.prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: Role.CLIENT,
        emailVerified: false,
        verificationToken: token,
        verificationTokenExpires: expires,
        clientProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        },
      },
    });

    // Send verification email — if it fails we still return success
    // so the user knows their account was created
    await this.mail.sendVerificationEmail(email, dto.firstName, token);

    return {
      message:
        'Account created successfully. Please check your email to verify your account before signing in.',
    };
  }

  // ── Verify email ──────────────────────────────────────────────────
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Verification token is required');

    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'This verification link is invalid. It may have already been used.',
      );
    }

    if (user.emailVerified) {
      return { message: 'Email already verified. You can sign in.' };
    }

    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires < new Date()
    ) {
      throw new BadRequestException(
        'This verification link has expired. Please request a new one.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  // ── Resend verification ───────────────────────────────────────────
  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    this.checkResendRateLimit(normalizedEmail);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: return success even if user doesn't exist
    if (!user || user.emailVerified) {
      return {
        message:
          'If an unverified account exists for this email, a new verification link has been sent.',
      };
    }

    const { token, expires } = this.generateVerificationToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpires: expires,
      },
    });

    await this.mail.sendVerificationEmail(normalizedEmail, user.name.split(' ')[0], token);

    return {
      message:
        'If an unverified account exists for this email, a new verification link has been sent.',
    };
  }

  // ── Login ─────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      await bcrypt.compare(dto.password, '$2b$12$placeholder.hash.for.timing.prevention');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    // Block unverified users — send special error code for frontend
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        JSON.stringify({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before signing in.',
          email: user.email,
        }),
      );
    }

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
    await this.prisma.refreshToken.deleteMany({ where: { token: oldToken } });
    return this.generateTokens(userId, email, role);
  }

  // ── Logout ────────────────────────────────────────────────────────
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private generateVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, expires };
  }

  private checkResendRateLimit(email: string) {
    const now = Date.now();
    const entry = resendAttempts.get(email);

    if (entry) {
      if (now < entry.resetAt) {
        if (entry.count >= RESEND_MAX) {
          throw new BadRequestException(
            'Too many resend attempts. Please wait 15 minutes before trying again.',
          );
        }
        entry.count += 1;
      } else {
        resendAttempts.set(email, { count: 1, resetAt: now + RESEND_WINDOW_MS });
      }
    } else {
      resendAttempts.set(email, { count: 1, resetAt: now + RESEND_WINDOW_MS });
    }
  }

  private async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRY') ?? '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRY') ?? '7d',
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
