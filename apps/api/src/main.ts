import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { FILE_SIZE_LIMIT } from '@workspace/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useBodyParser('json', { limit: FILE_SIZE_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: FILE_SIZE_LIMIT });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-hexclave-access-token',
      'x-hexclave-access-type',
      'x-hexclave-project-id',
      'x-hexclave-publishable-client-key',
      'x-hexclave',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
  });

  const port = configService.get<number>('port') ?? 8080;
  await app.listen(port);
}

(() => {
  void bootstrap();
})();
