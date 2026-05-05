import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { I18nService } from './i18n.service';
import { TranslationController } from './i18n.controller';
import { TranslationEntity } from './entities/translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TranslationEntity])],
  controllers: [TranslationController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
