import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Kevin' })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName: string;

  @ApiPropertyOptional({ example: 'Pierre' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  middleName?: string;

  @ApiProperty({ example: 'Mutabazi' })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: 'kevin@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: '+257 79 123 456' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
