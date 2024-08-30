import { FactoryProvider } from '@nestjs/common';
import { Redis } from 'ioredis';

export const RedisClientFactory: FactoryProvider<Redis> = {
  provide: 'RedisClient',
  useFactory: () => {
    const redisInstance = new Redis(process.env.REDIS_URL);

    redisInstance.on('error', (e) => {
      console.dir(redisInstance);
      throw new Error(`Redis connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [],
};
