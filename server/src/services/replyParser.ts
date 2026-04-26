export type ReplyParseResult =
  | { type: 'DONE'; code?: string }
  | { type: 'HELP'; code?: string; note?: string }
  | { type: 'DELAY'; code?: string; until?: Date }
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

function extractTaskCode(body: string): string | undefined {
  const m = body.match(/\bT-[A-Z2-9]{5}\b/i);
  return m ? m[0].toUpperCase() : undefined;
}

/**
 * Strips a task code (T-XXXXX) for command matching.
 */
function withoutTaskCodes(body: string) {
  return body.replace(/\bT-[A-Z2-9]{5}\b/gi, ' ').replace(/\s+/g, ' ').trim();
}

export function parseInboundReply(body: string, now = new Date()): ReplyParseResult {
  const trimmed = body.trim();
  if (!trimmed) return { type: 'UNKNOWN' };

  const code = extractTaskCode(trimmed);
  const inner = withoutTaskCodes(trimmed);

  if (/^done$/i.test(inner) || /^complete(?:d)?$/i.test(inner) || /^finished$/i.test(inner)) {
    return { type: 'DONE', ...(code ? { code } : {}) };
  }

  const helpMatch = inner.match(/^help(?:\s+(.*))?$/i);
  if (helpMatch) {
    const note = helpMatch[1]?.trim();
    return { type: 'HELP', ...(code ? { code } : {}), ...(note ? { note } : {}) };
  }

  const delayMatch = inner.match(/^delay(?:\s+(.*))?$/i);
  if (delayMatch) {
    const rest = delayMatch[1]?.trim() ?? '';
    const until = rest ? parseDelayDurationToDate(rest, now) : undefined;
    return { type: 'DELAY', ...(code ? { code } : {}), ...(until ? { until } : {}) };
  }

  return { type: 'UNKNOWN' };
}
