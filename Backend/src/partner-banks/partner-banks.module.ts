import { Module } from '@nestjs/common';
import { PartnerBanksController } from './partner-banks.controller';
import { PartnerBanksService } from './partner-banks.service';

@Module({
  controllers: [PartnerBanksController],
  providers: [PartnerBanksService],
  exports: [PartnerBanksService],
})
export class PartnerBanksModule {}
