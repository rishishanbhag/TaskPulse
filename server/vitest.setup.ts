process.env.PORT = process.env.PORT ?? '3000';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PUBLIC_URL = process.env.PUBLIC_URL ?? 'http://localhost:3000';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/taskpulse_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_secret_which_is_long_enough';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? 'test_google_client_id.apps.googleusercontent.com';

process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? 'ACtest';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? 'test';
process.env.TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

