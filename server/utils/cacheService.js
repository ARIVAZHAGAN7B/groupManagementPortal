let redisClient = null;
let isRedisAvailable = false;
let redisInitAttempted = false;

const memoryStore = new Map();
const stats = { hits: 0, misses: 0, redisActive: false };

const initRedis = async () => {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;

  const redisUrl = process.env.REDIS_URL; 
  if (!redisUrl) {
    return null;
  }

  try {
    const { createClient } = require("redis");
    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", (err) => {
      if (isRedisAvailable) {
        console.warn("[Cache] Redis error, falling back to memory store:", err?.message || err);
      }
      isRedisAvailable = false;
      stats.redisActive = false;
    });

    redisClient.on("ready", () => {
      console.log("[Cache] Redis client ready. Centralized caching active.");
      isRedisAvailable = true;
      stats.redisActive = true;
    });

    await redisClient.connect();
    isRedisAvailable = true;
    stats.redisActive = true;
    return redisClient;
  } catch (error) {
    console.warn("[Cache] Redis connection skipped/failed. Using in-memory fallback:", error?.message || error);
    isRedisAvailable = false;
    stats.redisActive = false;
    return null;
  }
};
// Attempt non-blocking initialization
void initRedis().catch(() => {});

const get = async (key) => {
  const safeKey = String(key || "").trim();
  if (!safeKey) return null;

  if (isRedisAvailable && redisClient?.isReady) {
    try {
      const raw = await redisClient.get(safeKey);
      if (raw !== null && raw !== undefined) {
        stats.hits += 1;
        return JSON.parse(raw);
      }
      stats.misses += 1;
      return null;
    } catch (_err) {
      // Fall through to memory store on redis failure
    }
  }

  const cached = memoryStore.get(safeKey);
  if (cached && Date.now() < cached.expiresAt) {
    stats.hits += 1;
    return cached.data;
  }

  if (cached && Date.now() >= cached.expiresAt) {
    memoryStore.delete(safeKey);
  }

  stats.misses += 1;
  return null;
};

const set = async (key, value, ttlSeconds = 30) => {
  const safeKey = String(key || "").trim();
  if (!safeKey) return;
  const safeTtl = Math.max(1, Number(ttlSeconds) || 30);

  if (isRedisAvailable && redisClient?.isReady) {
    try {
      await redisClient.set(safeKey, JSON.stringify(value), { EX: safeTtl });
      return;
    } catch (_err) {
      // Fall through to memory store
    }
  }

  memoryStore.set(safeKey, {
    data: value,
    expiresAt: Date.now() + safeTtl * 1000
  });
};

const del = async (key) => {
  const safeKey = String(key || "").trim();
  if (!safeKey) return;

  if (isRedisAvailable && redisClient?.isReady) {
    try {
      await redisClient.del(safeKey);
    } catch (_err) {}
  }

  memoryStore.delete(safeKey);
};

const delPrefix = async (prefix) => {
  const safePrefix = String(prefix || "").trim();
  if (!safePrefix) return;

  if (isRedisAvailable && redisClient?.isReady) {
    try {
      let cursor = "0";
      do {
        const reply = await redisClient.scan(cursor, { MATCH: safePrefix + "*", COUNT: 100 });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } while (cursor !== "0");
    } catch (_err) {}
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(safePrefix)) {
      memoryStore.delete(key);
    }
  }
};

const getOrSet = async (key, ttlSeconds, fetchFn) => {
  const existing = await get(key);
  if (existing !== null && existing !== undefined) {
    return existing;
  }

  const fresh = await fetchFn();
  if (fresh !== undefined && fresh !== null) {
    await set(key, fresh, ttlSeconds);
  }

  return fresh;
};

const getStats = () => ({
  ...stats,
  memoryKeysCount: memoryStore.size,
  redisConnected: Boolean(isRedisAvailable && redisClient?.isReady)
});

module.exports = {
  get,
  set,
  del,
  delPrefix,
  getOrSet,
  getStats,
  initRedis
};
