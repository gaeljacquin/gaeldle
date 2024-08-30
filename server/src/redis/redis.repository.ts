import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisRepository {
  constructor(@Inject('RedisClient') private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async hmset(key: string, data: any[]): Promise<void> {
    await this.redisClient.hmset(key, data);
  }
}
