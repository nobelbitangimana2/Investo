import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectDepositDto {
  @ApiProperty({ example: 'Reference number does not match bank records.' })
  @IsString()
  @MinLength(10)
  rejectionNote: string;
}
