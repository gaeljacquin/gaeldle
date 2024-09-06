import { Injectable, OnModuleInit, Inject, Provider } from '@nestjs/common';
import 'dotenv/config';
import { client, db } from '@/src/drizzle/db';

export const DrizzleProvider: Provider = {
  provide: 'DB',
  useValue: db,
};

@Injectable()
export class DrizzleService implements OnModuleInit {
  constructor(@Inject('DB') public readonly db) {}

  async onModuleInit() {
    await client.connect();
  }
}
