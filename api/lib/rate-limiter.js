const RATE_LIMIT_STORE = new Map();

const PATH_LIMITS = {
  '/api/ai/translate': { limit: 5, window: 60 },
  '/api/share/create': { limit: 10, window: 60 },
  '/api/share/hug': { limit: 3, window: 60 },
  '/api/share/batch': { limit: 5, window: 60 },
  '/api/share/feed': { limit: 30, window: 60 },
  '/api/share/publish': { limit: 5, window: 60 },
  '/api/share/comment': { limit: 15, window: 60 },
  '/api/share/like': { limit: 20, window: 60 },
};

const DEFAULT_LIMIT = { limit: 3, window: 60 };
const GLOBAL_LIMIT = { limit: 60, window: 60 };

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    '127.0.0.1'
  );
}

function isAllowed(key, limit, window) {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(key);

  if (!entry) {
    RATE_LIMIT_STORE.set(key, { timestamps: [now] });
    return true;
  }

  entry.timestamps = entry.timestamps.filter((ts) => now - ts < window * 1000);

  if (entry.timestamps.length >= limit) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

export function checkRateLimit(req, path, keySuffix) {
  const ip = getClientIp(req);
  const globalKey = `global:${ip}`;
  const pathKey = keySuffix
    ? `path:${ip}:${path}:${keySuffix}`
    : `path:${ip}:${path}`;

  if (!isAllowed(globalKey, GLOBAL_LIMIT.limit, GLOBAL_LIMIT.window)) {
    return { allowed: false, message: '请求过于频繁，请稍后再试' };
  }

  const pathConfig = PATH_LIMITS[path] || DEFAULT_LIMIT;
  if (!isAllowed(pathKey, pathConfig.limit, pathConfig.window)) {
    return { allowed: false, message: '请求过于频繁，请稍后再试' };
  }

  return { allowed: true };
}

export function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_STORE.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < 120000);
    if (entry.timestamps.length === 0) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}
