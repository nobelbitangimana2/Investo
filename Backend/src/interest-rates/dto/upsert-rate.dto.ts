import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, Max } from 'class-validator';
import { InvestmentPeriod } from '@prisma/client';

export class UpsertRateDto {
  @ApiProperty({ enum: InvestmentPeriod })
  @IsEnum(InvestmentPeriod)
  investmentPeriod: InvestmentPeriod;

  @ApiProperty({ example: 35.0, description: 'Rate percentage e.g. 35 = 35%' })
  @IsNumber()
  @Min(0)
  @Max(1000)
  ratePercentage: number;
}
