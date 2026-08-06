import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNumber, Min, MinLength } from 'class-validator';
import { Bank } from '@prisma/client';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 'Kevin Mutabazi' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ enum: Bank })
  @IsEnum(Bank)
  bankToTransferTo: Bank;

  @ApiProperty({ example: 'BCB-00123456' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'Kevin Mutabazi' })
  @IsString()
  @MinLength(2)
  recipientName: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(1000)
  amount: number;
}
