import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: '*' }); // разрешаем CORS для всех (настройте по необходимости)
  await app.listen(process.env.PORT ?? 4000);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
