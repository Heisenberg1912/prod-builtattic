import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
export const redis=new IORedis(process.env.REDIS_URL||'redis://localhost:6379');
export function makeQueue(name){ return new Queue(name,{connection:redis}); }
export function makeWorker(name,processor){ return new Worker(name,processor,{connection:redis}); }
export function makeEvents(name){ return new QueueEvents(name,{connection:redis}); }
