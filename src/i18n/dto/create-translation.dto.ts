// src/i18n/dto/create-translation.dto.ts
import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTranslationDto {
  @ApiProperty({ example: 'nav.home', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  key: string;

  @ApiProperty({ enum: ['hy', 'ru', 'en'] })
  @IsIn(['hy', 'ru', 'en'])
  lang: string;

  @ApiProperty({ example: 'Home' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 'common' })
  @IsOptional()
  @IsString()
  namespace?: string;
}
