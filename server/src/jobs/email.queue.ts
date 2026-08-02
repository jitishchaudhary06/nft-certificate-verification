import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { sendEmail, EmailPayload } from '../services/email.service';

let connection: IORedis | null = null;
let emailQueue: Queue | null = null;
let redisAvailable = false;

export const initEmailQueue = async (): Promise<void> => {
  try {
    connection = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      reconnectOnError: () => false,
    });
    connection.on('error', () => {
      // swallow — Redis is optional
    });
    await connection.connect();
    await connection.ping();
    redisAvailable = true;
    emailQueue = new Queue('email', { connection });

    new Worker(
      'email',
      async (job: Job<EmailPayload>) => {
        await sendEmail(job.data);
      },
      { connection, concurrency: 5 }
    );

    console.log('[Queue] Email queue connected via Redis');
  } catch {
    redisAvailable = false;
    if (connection) {
      try {
        connection.disconnect();
      } catch {
        // ignore
      }
      connection = null;
    }
    console.warn('[Queue] Redis unavailable — emails will send synchronously');
  }
};

export const enqueueEmail = async (payload: EmailPayload): Promise<void> => {
  if (redisAvailable && emailQueue) {
    await emailQueue.add('send', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    return;
  }
  await sendEmail(payload);
};

export const getRedisStatus = () => redisAvailable;
