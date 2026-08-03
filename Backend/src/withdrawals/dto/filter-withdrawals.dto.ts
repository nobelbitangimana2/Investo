import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { Bank, WithdrawalStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterWithdrawalsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional({ enum: Bank }) @IsOptional() @IsEnum(Bank) bank?: Bank;
  @ApiPropertyOptional({ enum: WithdrawalStatus }) @IsOptional() @IsEnum(WithdrawalStatus) status?: WithdrawalStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}
