import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { connectDb } from '@/config/db.js';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { errorMiddleware } from '@/middlewares/error.js';
import { router } from '@/routes/index.js';

async function main() {
  await connectDb();

  const app = express();

  app.use((pinoHttp as any)({ logger }) as any);
  app.use(helmet());
  app.use(cors());
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
  app.use(express.json());

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use(router);

  app.use(errorMiddleware);

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'API listening');
  });
}

main().catch((err) => {
  logger.error({ err }, 'API failed to start');
  process.exit(1);
});

