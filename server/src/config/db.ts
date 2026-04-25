import mongoose from 'mongoose';

import { env } from '@/config/env.js';
import { logger } from '@/config/logger.js';

let isConnected = false;

export async function connectDb() {
  if (isConnected) return;

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGO_URI);
  isConnected = true;
  console.log('Mongo started');
}

