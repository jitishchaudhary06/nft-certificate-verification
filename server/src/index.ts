import app from './app';
import { env } from './config/env';
import { initEmailQueue } from './jobs/email.queue';

const start = async () => {
  await initEmailQueue();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
    console.log(`📚 Swagger docs at http://localhost:${env.port}/api/docs`);
    console.log(`🌍 Environment: ${env.nodeEnv}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
