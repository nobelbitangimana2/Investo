import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateAccountantDto {
  @ApiProperty({ example: 'Grace Iradukunda' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'grace@investo.bi' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TempPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
