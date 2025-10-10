import { createClient } from 'redis';
import dotenv from 'dotenv'
import { LogController } from '@controller/log.controller';

dotenv.config();
const HOST = String(process.env.REDIS_HOST);
const PORT = Number(process.env.REDIS_PORT);
const USERNAME = String(process.env.REDIS_USERNAME);
const PASSWORD = String(process.env.REDIS_PASSWORD);

export const redisStore = createClient({
  url: `redis://${HOST}:${PORT}`,
  username: USERNAME,
  password: PASSWORD
});

export const redisPub = createClient({
  url: `redis://${HOST}:${PORT}`,
  username: USERNAME,
  password: PASSWORD
});

export const redisSub = createClient({
  url: `redis://${HOST}:${PORT}`,
  username: USERNAME,
  password: PASSWORD
});

let connected = false;

export async function connectRedis() {
  if (!connected) {
    try {
      await Promise.all([
        redisStore.connect(),
        redisPub.connect(),
        redisSub.connect(),
      ]);
      connected = true;

      LogController.LogEvent('Redis', 'Redis running.');
    } catch (err) {
      if (err instanceof Error) {
        LogController.LogError('Redis', err.message);
      } else {
        LogController.LogError('Redis', 'Unknown error: '+ JSON.stringify(err));
      } 
    }

    redisStore.on('error', err => LogController.LogError('RedisStore', err.message));
    redisPub.on('error', err => LogController.LogError('RedisPub', err.message));
    redisSub.on('error', err => LogController.LogError('RedisSub', err.message));
  }
}

process.on('SIGINT', async () => {
  LogController.LogEvent('Redis','Stopping Redis Server');
  await Promise.all([redisStore.quit(), redisPub.quit(), redisSub.quit()]);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  LogController.LogEvent('Redis', 'Stopping Redis Server');
  await Promise.all([redisStore.quit(), redisPub.quit(), redisSub.quit()]);
  process.exit(0);
});