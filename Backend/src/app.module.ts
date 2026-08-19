import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { DepositsModule } from './deposits/deposits.module';
import { InvestmentsModule } from './investments/investments.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { InterestRatesModule } from './interest-rates/interest-rates.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';
import { PartnerBanksModule } from './partner-banks/partner-banks.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Config — load .env globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Scheduled jobs (interest accrual cron)
    ScheduleModule.forRoot(),

    // Shared infrastructure
    PrismaModule,
    CloudinaryModule,
    MailModule,

    // Domain modules
    AuthModule,
    UsersModule,
    ClientsModule,
    DepositsModule,
    InvestmentsModule,
    WithdrawalsModule,
    InterestRatesModule,
    NotificationsModule,
    AuditLogsModule,
    ReportsModule,
    PartnerBanksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
