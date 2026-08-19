import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreatePartnerBankDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountName?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(50)
  accountNumber: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePartnerBankDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  accountNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
