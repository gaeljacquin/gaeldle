import { Injectable } from '@nestjs/common';
import { RedisRepository } from './redis.repository';

@Injectable()
export class RedisService {
  constructor(private readonly redisRepository: RedisRepository) {}

  async setData(key: string, data: any): Promise<void> {
    await this.redisRepository.set(key, data);
  }

  async getData(key: string): Promise<any | null> {
    const data = await this.redisRepository.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setDataAsHash(key: string, data: any): Promise<void> {
    const hashData = Object.entries(data).flat();
    await this.redisRepository.hmset(key, hashData);
  }

  async deleteKey(key: string): Promise<void> {
    await this.redisRepository.delete(key);
  }
}
