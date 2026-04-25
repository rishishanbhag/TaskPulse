import { redis } from '@/config/redis.js';

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    await redis.del(key);
    return null;
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number) {
  const payload = JSON.stringify(value);
  await redis.set(key, payload, 'EX', ttlSeconds);
}

export async function delKeys(keys: string[]) {
  const uniq = Array.from(new Set(keys)).filter(Boolean);
  if (uniq.length === 0) return;
  await redis.del(...uniq);
}

export async function delByPattern(pattern: string) {
  let cursor = '0';
  const keys: string[] = [];
  do {
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0');

  if (keys.length) {
    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.del(k);
    await pipeline.exec();
  }
}

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const existing = await getJson<T>(key);
  if (existing !== null) return existing;
  const value = await loader();
  await setJson(key, value, ttlSeconds);
  return value;
}

