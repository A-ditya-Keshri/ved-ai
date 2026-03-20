import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

export const generationQueue = new Queue('question-generation', {
  connection: redisConnection as any,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
