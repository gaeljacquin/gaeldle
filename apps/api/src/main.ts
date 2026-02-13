import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string[]>('corsAllowedOrigins') ?? [],
    methods: ['GET', 'POST', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = configService.get<number>('port') ?? 8080;
  await app.listen(port);
}

(() => {
  void bootstrap();
})();
