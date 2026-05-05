// src/i18n/dto/create-translation.dto.ts
import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';

export class CreateTranslationDto {
  @IsString()
  @MaxLength(255)
  key: string;

  @IsIn(['hy', 'ru', 'en'])
  lang: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  namespace?: string; // 'common' | 'auth' | 'profile' | 'admin'
}
