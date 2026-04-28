import 'dotenv/config';
import mongoose from 'mongoose';

import { env } from '../src/config/env.js';

async function main() {
  await mongoose.connect(env.MONGO_URI);
  await mongoose.connection.dropDatabase();
   
  console.log('Database dropped.');
  await mongoose.disconnect();
}

main().catch((e) => {
   
  console.error(e);
  process.exit(1);
});
