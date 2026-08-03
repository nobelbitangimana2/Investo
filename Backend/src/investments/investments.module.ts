import { Module } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';
import { InterestService } from './interest.service';

@Module({
  providers: [InvestmentsService, InterestService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService, InterestService],
})
export class InvestmentsModule {}
