import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';
import { Bank } from '@prisma/client';

const MOBILE_MONEY_PROVIDERS: Bank[] = [Bank.LUMICASH, Bank.ECOCASH];

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'Kevin Mutabazi' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: Bank })
  @IsEnum(Bank)
  bankToTransferTo: Bank;

  @ApiPropertyOptional({ example: 'BCB-00123456', description: 'Required for bank transfers' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: '+257 79 123 456', description: 'Required for Lumicash / Ecocash' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'Kevin Mutabazi' })
  @IsString()
  @MinLength(2)
  recipientName: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(10000)
  amount: number;

  /** Derived helper — true when bankToTransferTo is a mobile money provider */
  get isMobileMoney(): boolean {
    return MOBILE_MONEY_PROVIDERS.includes(this.bankToTransferTo);
  }
}
