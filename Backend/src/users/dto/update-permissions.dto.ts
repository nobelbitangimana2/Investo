import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() viewDeposits?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmDeposits?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rejectDeposits?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() viewWithdrawals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmWithdrawals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rejectWithdrawals?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() generateReports?: boolean;
}
