import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1),
});

export const env = schema.parse(import.meta.env);

