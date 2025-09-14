type Key = string;

type Bucket = {
  tokens: number;
  lastRefillMs: number;
};

const buckets = new Map<Key, Bucket>();

function getBucket(key: Key, capacity: number): Bucket {
  const existing = buckets.get(key);
  if (existing) return existing;
  const bucket = { tokens: capacity, lastRefillMs: Date.now() };
  buckets.set(key, bucket);
  return bucket;
}

// Simple token bucket: capacity tokens per windowMs
export function allow({
  key,
  capacity = 5,
  windowMs = 10_000,
}: {
  key: string;
  capacity?: number;
  windowMs?: number;
}): boolean {
  const bucket = getBucket(key, capacity);
  const now = Date.now();
  const elapsed = now - bucket.lastRefillMs;
  if (elapsed > windowMs) {
    const refillCount = Math.floor(elapsed / windowMs);
    bucket.tokens = Math.min(capacity, bucket.tokens + refillCount);
    bucket.lastRefillMs += refillCount * windowMs;
  }
  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

export function rateLimitKey(userId: string, route: string) {
  return `${userId}:${route}`;
}
