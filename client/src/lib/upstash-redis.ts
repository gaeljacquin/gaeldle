export const upstashRedisInit = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.upstashRedisRestToken}`,
  },
};
