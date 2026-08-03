import { Module } from '@nestjs/common';
import { InterestRatesService } from './interest-rates.service';
import { InterestRatesController } from './interest-rates.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  providers: [InterestRatesService],
  controllers: [InterestRatesController],
  exports: [InterestRatesService],
})
export class InterestRatesModule {}
