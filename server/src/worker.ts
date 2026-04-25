import { connectDb } from '@/config/db.js';
import { logger } from '@/config/logger.js';
import { initTaskWorker } from '@/workers/taskWorker.js';

async function main() {
  await connectDb();
  initTaskWorker();
}

main().catch((err) => {
  logger.error({ err }, 'Worker failed to start');
  process.exit(1);
});

