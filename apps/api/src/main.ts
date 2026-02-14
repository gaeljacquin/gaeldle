import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-stack-access-token',
      'x-stack-access-type',
      'x-stack-project-id',
      'x-stack-publishable-client-key',
      'x-stack-auth',
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
