import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslationEntity } from './entities/translation.entity';
import { I18nService } from './i18n.service';
import { CreateTranslationDto } from './dto/create-translation.dto';
import { UpdateTranslationDto } from './dto/update-translation.dto';

@Controller('translations')
export class TranslationController {
  constructor(
    @InjectRepository(TranslationEntity)
    private readonly repo: Repository<TranslationEntity>,
    private readonly i18nService: I18nService,
  ) {}

  // Для Next.js: GET /translations/lang/ru
  @Get('lang/:lang')
  async getByLang(
    @Param('lang') lang: string,
    @Query('namespace') namespace?: string,
  ) {
    return this.i18nService.getTranslationsForLang(lang, namespace);
  }

  // Для Next.js: GET /translations/lang/ru/namespace/common
  @Get('lang/:lang/namespace/:namespace')
  async getByLangAndNamespace(
    @Param('lang') lang: string,
    @Param('namespace') namespace: string,
  ) {
    return this.i18nService.getTranslationsForLang(lang, namespace);
  }

  // Admin: получить все ключи
  @Get()
  async findAll(
    @Query('namespace') namespace?: string,
    @Query('lang') lang?: string,
  ) {
    const where: any = {};
    if (namespace) where.namespace = namespace;
    if (lang) where.lang = lang;
    return this.repo.find({ where, order: { namespace: 'ASC', key: 'ASC' } });
  }

  // Admin: создать перевод
  @Post()
  async create(@Body() dto: CreateTranslationDto) {
    const translation = this.repo.create(dto);
    const saved = await this.repo.save(translation);
    await this.i18nService.reloadTranslations();
    return saved;
  }

  // Admin: обновить перевод
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTranslationDto) {
    await this.repo.update(id, dto);
    await this.i18nService.reloadTranslations(); // горячая перезагрузка
    return this.repo.findOne({ where: { id } });
  }

  // Admin: удалить
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.repo.delete(id);
    await this.i18nService.reloadTranslations();
    return { success: true };
  }

  // Admin: bulk upsert (удобно для импорта JSON)
  @Post('bulk')
  async bulkUpsert(@Body() translations: CreateTranslationDto[]) {
    for (const t of translations) {
      await this.repo.upsert(t, ['key', 'lang']);
    }
    await this.i18nService.reloadTranslations();
    return { updated: translations.length };
  }
}
