export type ReplyParseResult =
  | { type: 'DONE' }
  | { type: 'HELP'; note?: string }
  | { type: 'DELAY'; until?: Date }
  | { type: 'UNKNOWN' };

function parseDelayDurationToDate(rest: string, now: Date) {
  const m = rest.trim().match(/^(\d+)\s*([hd])$/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (!Number.isFinite(n) || n <= 0) return undefined;

  const ms = unit === 'h' ? n * 60 * 60 * 1000 : n * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() + ms);
}

export function parseInboundReply(body: string, now = new Date()): ReplyParseResult {
  const trimmed = body.trim();
  if (!trimmed) return { type: 'UNKNOWN' };

  if (/^done$/i.test(trimmed)) return { type: 'DONE' };

  const helpMatch = trimmed.match(/^help(?:\s+(.*))?$/i);
  if (helpMatch) {
    const note = helpMatch[1]?.trim();
    return { type: 'HELP', ...(note ? { note } : {}) };
  }

  const delayMatch = trimmed.match(/^delay(?:\s+(.*))?$/i);
  if (delayMatch) {
    const rest = delayMatch[1]?.trim() ?? '';
    const until = rest ? parseDelayDurationToDate(rest, now) : undefined;
    return { type: 'DELAY', ...(until ? { until } : {}) };
  }

  return { type: 'UNKNOWN' };
}

