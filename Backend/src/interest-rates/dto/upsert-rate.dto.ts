import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, MinLength, MaxLength, Min, Max } from 'class-validator';

export class UpsertRateDto {
  @ApiProperty({
    example: 'Weekly',
    description: 'Free-text investment period name (e.g. "Weekly", "3 Months", "2 Years")',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  investmentPeriod: string;

  @ApiProperty({ example: 35.0, description: 'Rate percentage e.g. 35 = 35%' })
  @IsNumber()
  @Min(0)
  @Max(1000)
  ratePercentage: number;
}
