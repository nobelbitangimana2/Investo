import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectWithdrawalDto {
  @ApiProperty({ example: 'Insufficient verified investment balance.' })
  @IsString()
  @MinLength(10)
  rejectionNote: string;
}
