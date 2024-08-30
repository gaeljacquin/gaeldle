import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisPubSubService {
  constructor(@Inject('RedisClient') private readonly redisClient: Redis) {}

  async publish(channel: string, message: string): Promise<void> {
    await this.redisClient.publish(channel, message);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = new Redis(this.redisClient.options);
    subscriber.subscribe(channel);
    subscriber.on('message', (_ /** channel */, message) => callback(message));
  }
}
