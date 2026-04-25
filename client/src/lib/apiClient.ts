import { env } from '@/config/env';

export type ApiError = {
  message: string;
  issues?: { path: (string | number)[]; message: string }[];
};

export class HttpError extends Error {
  status: number;
  apiError?: ApiError;
  constructor(status: number, message: string, apiError?: ApiError) {
    super(message);
    this.status = status;
    this.apiError = apiError;
  }
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
};

export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${env.VITE_API_BASE_URL}${path}`;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(url, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  const json = text ? (JSON.parse(text) as any) : null;

  if (!res.ok) {
    const apiError = (json?.error ?? undefined) as ApiError | undefined;
    const msg = apiError?.message ?? `Request failed (${res.status})`;
    throw new HttpError(res.status, msg, apiError);
  }

  return json as T;
}

