'use server';

import { Redis } from '@upstash/redis';
import { Game, Games } from '@/services/games';
import { CheckAnswer } from '@/types/check-answer';

const redis = new Redis({
  url: process.env.kvRestApiUrl,
  token: process.env.kvRestApiToken,
});

export async function setHiloVal(key: string, value: Game) {
  setKeyVal(key, value, true, true);
}

export async function getHiloVal(key: string, fields: string[]): Promise<unknown> {
  return getVal(key, true, fields) as Promise<Partial<Game>>;
}

export async function setCoverVal(key: string, value: number) {
  setKeyVal(key, value);
}

export async function getCoverVal(key: string): Promise<unknown> {
  return getVal(key) as Promise<number>;
}

export async function setTimelineVal(key: string, value: Games) {
  setKeyVal(key, value, true);
}

export async function getTimelineVal(key: string): Promise<unknown> {
  return getVal(key) as Promise<Game[]>;
}

export async function setKeyVal(
  key: string,
  value: CheckAnswer,
  isHash?: boolean,
  saveAsHash?: boolean
) {
  if (isHash && saveAsHash) {
    await redis.hmset(key, value as Partial<Game>);
  } else if (isHash && !saveAsHash) {
    await redis.set(key, JSON.stringify(value as Partial<Game>));
  } else {
    await redis.set(key, value);
  }

  await redis.expire(key, 3600);
}

export async function getVal(key: string, isHash?: boolean, fields?: string[]) {
  const data = isHash && fields ? await redis.hmget(key, ...fields) : await redis.get(key);

  return data;
}
