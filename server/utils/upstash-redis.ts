export const upstashRedisInit = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
  },
};
