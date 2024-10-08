import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: [
      new RegExp('^https://.*gaeldle.*\\.vercel\\.app$'),
      process.env.CLIENT_URL,
    ],
    methods: 'GET,POST,PATCH,PUT',
    credentials: false,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
