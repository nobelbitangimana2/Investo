import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: '+257 79 123 456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({ example: '15, Avenue du Large' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({ example: 'Bujumbura' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({ example: 'Bujumbura Mairie' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  province?: string;
}
