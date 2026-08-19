import { Module } from '@nestjs/common';
import { PartnerBanksController } from './partner-banks.controller';
import { PartnerBanksService } from './partner-banks.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [PartnerBanksController],
  providers: [PartnerBanksService],
  exports: [PartnerBanksService],
})
export class PartnerBanksModule {}
