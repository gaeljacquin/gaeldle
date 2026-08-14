import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApi() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });

    const config = new DocumentBuilder()
      .setTitle('Gaeldle API')
      .setDescription('The Gaeldle API specification')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const outputPath = path.resolve(__dirname, '../openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

    await app.close();
    console.log('Successfully generated openapi.json at', outputPath);
  } catch (err) {
    console.error('Failed to generate OpenAPI spec:', err);
    process.exit(1);
  }
}

generateOpenApi();
