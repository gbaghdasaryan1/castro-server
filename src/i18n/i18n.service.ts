// src/i18n/i18n.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslationEntity } from './entities/translation.entity';
import i18next from 'i18next';

@Injectable()
export class I18nService implements OnModuleInit {
  constructor(
    @InjectRepository(TranslationEntity)
    private readonly translationRepo: Repository<TranslationEntity>,
  ) {}

  async onModuleInit() {
    await this.initI18n();
  }

  // Загружаем все переводы из БД и инициализируем i18next
  async initI18n() {
    const translations = await this.translationRepo.find();
    const resources = this.buildResources(translations);

    await i18next.init({
      lng: 'hy',
      fallbackLng: 'en',
      supportedLngs: ['hy', 'ru', 'en'],
      resources,
      interpolation: { escapeValue: false },
    });
  }

  private buildResources(translations: TranslationEntity[]) {
    const resources: Record<string, any> = {};

    for (const t of translations) {
      if (!resources[t.lang]) resources[t.lang] = {};
      const ns = t.namespace || 'common';
      if (!resources[t.lang][ns]) resources[t.lang][ns] = {};
      resources[t.lang][ns][t.key] = t.value;
    }

    return resources;
  }

  // Горячая перезагрузка при изменении переводов через Admin
  async reloadTranslations() {
    const translations = await this.translationRepo.find();
    const resources = this.buildResources(translations);

    for (const lang of ['hy', 'ru', 'en']) {
      if (resources[lang]) {
        for (const ns of Object.keys(resources[lang])) {
          i18next.addResourceBundle(lang, ns, resources[lang][ns], true, true);
        }
      }
    }
  }

  // Вернуть все переводы для одного языка (для Next.js SSR)
  async getTranslationsForLang(
    lang: string,
    namespace?: string,
  ): Promise<Record<string, string>> {
    const where: any = { lang };
    if (namespace) where.namespace = namespace;

    const translations = await this.translationRepo.find({ where });
    return translations.reduce(
      (acc, t) => {
        acc[t.key] = t.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  translate(key: string, lang: string, options?: object): string {
    return i18next.t(key, { lng: lang, ...options });
  }
}
