import { describe, expect, it, vi } from 'vitest';

import { apiFetch, HttpError } from '@/lib/apiClient';

vi.mock('@/config/env', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:3000',
    VITE_GOOGLE_CLIENT_ID: 'x',
  },
}));

describe('apiFetch', () => {
  it('throws HttpError on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return {
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ error: { message: 'Unauthorized' } }),
        } satisfies Partial<Response> as Response;
      }),
    );

    await expect(apiFetch('/auth/me', { method: 'GET' })).rejects.toBeInstanceOf(HttpError);
  });

  it('returns parsed JSON on ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ ok: true }),
        } satisfies Partial<Response> as Response;
      }),
    );

    await expect(apiFetch<{ ok: boolean }>('/healthz', { method: 'GET' })).resolves.toEqual({ ok: true });
  });
});

