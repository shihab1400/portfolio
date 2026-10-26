/**
 * Fixed-window, in-memory rate limiter. On serverless platforms each warm instance
 * keeps its own window, so this is best-effort protection; pair it with the host's
 * firewall/WAF rules (e.g. Vercel Firewall) for stricter guarantees.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string, now = Date.now()): boolean {
    // Drop expired windows so the map can't grow without bound.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  };
}
