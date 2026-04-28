import { randomUUID } from 'node:crypto';

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { connectDb } from '@/config/db.js';
import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { verifyTwilioConnected } from '@/config/twilio.js';
import { errorMiddleware } from '@/middlewares/error.js';
import { router } from '@/routes/index.js';

async function main() {
  await connectDb();
  await verifyTwilioConnected();

  const app = express();

  app.use(
    (pinoHttp as any)({
      logger,
      genReqId: (req: any, res: any) => {
        const existing = req.headers['x-request-id'];
        const id = typeof existing === 'string' && existing ? existing : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }) as any,
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 600,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use(router);

  app.use(errorMiddleware);

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
  });
}

main().catch((err) => {
  logger.error({ err }, 'API failed to start');
  process.exit(1);
});

