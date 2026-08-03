import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { Bank, DepositStatus, InvestmentPeriod } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterDepositsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional({ enum: Bank }) @IsOptional() @IsEnum(Bank) bank?: Bank;
  @ApiPropertyOptional({ enum: DepositStatus }) @IsOptional() @IsEnum(DepositStatus) status?: DepositStatus;
  @ApiPropertyOptional({ enum: InvestmentPeriod }) @IsOptional() @IsEnum(InvestmentPeriod) investmentPeriod?: InvestmentPeriod;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
