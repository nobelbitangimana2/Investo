import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Bank, InvestmentPeriod } from '@prisma/client';

export class CreateDepositDto {
  @ApiProperty({ example: 'Kevin Mutabazi' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: Bank })
  @IsEnum(Bank)
  bank: Bank;

  @ApiProperty({ example: 'BCB-00123456' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2024-01-10' })
  @IsDateString()
  depositDate: string;

  @ApiProperty({ enum: InvestmentPeriod })
  @IsEnum(InvestmentPeriod)
  investmentPeriod: InvestmentPeriod;

  @ApiProperty({ example: 'BCB-REF-20240110-001' })
  @IsString()
  @MinLength(3)
  referenceNumber: string;
}
