import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { S3Service } from '@/lib/s3.service';
import { AuthModule } from '@/auth/auth.module';
import configuration from '@/config/configuration';
import { GamesModule } from '@/games/games.module';
import { ORPCModule } from '@orpc/nest';

const appEnv = (
  process.env.APP_ENV ||
  process.env.NODE_ENV ||
  'development'
).toLowerCase();
const envFilePath = [
  `.env.${appEnv}.local`,
  `.env.local`,
  `.env.${appEnv}`,
  '.env',
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      load: [configuration],
    }),
    ORPCModule.forRoot({}),
    AuthModule,
    GamesModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
  exports: [S3Service],
})
export class AppModule {}
