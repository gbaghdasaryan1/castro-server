import { Test, TestingModule } from '@nestjs/testing';
import { I18nController } from './i18n.controller';
import { I18nService } from './i18n.service';

describe('I18nController', () => {
  let controller: I18nController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [I18nController],
      providers: [I18nService],
    }).compile();

    controller = module.get<I18nController>(I18nController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
