import axios from "axios";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getApiBaseUrl = () => {
  const envBaseUrl = String(
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_API || ""
  ).trim();

  if (envBaseUrl) {
    return trimTrailingSlash(envBaseUrl);
  }

  if (typeof window !== "undefined") {
    if (import.meta.env.DEV) {
      return "http://localhost:5000";
    }

    return trimTrailingSlash(window.location.origin);
  }

  return "";
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // IMPORTANT for cookie auth
});

const CACHE_KEY_PREFIX = "gmp:client-cache:v1:entry:";
const CACHE_TAG_INDEX_KEY = "gmp:client-cache:v1:tags";
const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEntry = {
  createdAt: number;
  expiresAt: number;
  tags: string[];
  value: unknown;
};

type CachedGetOptions = {
  enabled?: boolean;
  key?: string;
  storage?: "memory" | "persistent";
  tags?: string[];
  ttlMs?: number;
};

type MutationOptions = {
  invalidateTags?: string[];
};

export const CLIENT_CACHE_TTL = {
  SHORT: 30 * 1000,
  MEDIUM: DEFAULT_CACHE_TTL_MS,
  LONG: 10 * 60 * 1000
} as const;

export const CLIENT_CACHE_STORAGE = {
  MEMORY: "memory",
  PERSISTENT: "persistent"
} as const;

export const CLIENT_CACHE_TAGS = {
  EVENTS: "events",
  GROUPS: "groups",
  GROUP_ELIGIBILITY: "group-eligibility",
  GROUP_MEMBERSHIPS: "group-memberships",
  GROUP_RANKS: "group-ranks",
  HOLIDAYS: "holidays",
  LEADERBOARDS: "leaderboards",
  PHASES: "phases",
  PHASE_TARGETS: "phase-targets",
  SYSTEM_CONFIG: "system-config",
  TEAM_MEMBERSHIPS: "team-memberships",
  TEAM_TARGETS: "team-targets",
  TEAMS: "teams",
  TEAM_TIER_CHANGE: "team-tier-change"
} as const;

const memoryCache = new Map<string, CacheEntry>();
const memoryTagIndex = new Map<string, Set<string>>();

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
};

const isPlainObject = (value: unknown) =>
  Object.prototype.toString.call(value) === "[object Object]";

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([entryKey, entryValue]) => `${JSON.stringify(entryKey)}:${stableSerialize(entryValue)}`);

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
};

const getEntryStorageKey = (cacheKey: string) => `${CACHE_KEY_PREFIX}${cacheKey}`;

const readTagIndex = (): Record<string, string[]> => {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(CACHE_TAG_INDEX_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? (parsed as Record<string, string[]>) : {};
  } catch (_error) {
    return {};
  }
};

const writeTagIndex = (index: Record<string, string[]>) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(CACHE_TAG_INDEX_KEY, JSON.stringify(index));
  } catch (_error) {
    // Ignore storage write failures and fall back to in-memory cache only.
  }
};

const persistEntry = (cacheKey: string, entry: CacheEntry) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(getEntryStorageKey(cacheKey), JSON.stringify(entry));
  } catch (_error) {
    // Ignore persistence failures and keep serving the in-memory entry.
  }
};

const removeEntryStorage = (cacheKey: string) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(getEntryStorageKey(cacheKey));
  } catch (_error) {
    // Ignore storage cleanup failures.
  }
};

const removeCacheKeyFromIndex = (cacheKey: string, knownTags: string[] = []) => {
  const memoryTagsToClean = new Set<string>(knownTags);
  memoryTagIndex.forEach((keys, tag) => {
    if (keys.has(cacheKey)) {
      memoryTagsToClean.add(tag);
    }
  });

  memoryTagsToClean.forEach((tag) => {
    const keys = memoryTagIndex.get(tag);
    if (!keys) return;

    keys.delete(cacheKey);
    if (keys.size === 0) {
      memoryTagIndex.delete(tag);
    }
  });

  const index = readTagIndex();
  const tagsToClean = new Set<string>(knownTags);

  Object.entries(index).forEach(([tag, keys]) => {
    if (Array.isArray(keys) && keys.includes(cacheKey)) {
      tagsToClean.add(tag);
    }
  });

  let changed = false;
  tagsToClean.forEach((tag) => {
    const nextKeys = (index[tag] || []).filter((key) => key !== cacheKey);
    if (nextKeys.length === 0) {
      if (index[tag]) {
        delete index[tag];
        changed = true;
      }
      return;
    }

    if ((index[tag] || []).length !== nextKeys.length) {
      index[tag] = nextKeys;
      changed = true;
    }
  });

  if (changed) {
    writeTagIndex(index);
  }
};

const removeClientCacheKey = (cacheKey: string) => {
  const existingEntry = memoryCache.get(cacheKey);
  memoryCache.delete(cacheKey);
  removeEntryStorage(cacheKey);
  removeCacheKeyFromIndex(cacheKey, existingEntry?.tags || []);
};

const isExpiredEntry = (entry: CacheEntry | null | undefined) =>
  !entry || !Number.isFinite(entry.expiresAt) || entry.expiresAt <= Date.now();

const parseStoredEntry = (raw: string | null): CacheEntry | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;

    return {
      createdAt: Number((parsed as CacheEntry).createdAt) || Date.now(),
      expiresAt: Number((parsed as CacheEntry).expiresAt) || 0,
      tags: Array.isArray((parsed as CacheEntry).tags) ? (parsed as CacheEntry).tags : [],
      value: (parsed as CacheEntry).value
    };
  } catch (_error) {
    return null;
  }
};

const readClientCacheValue = (
  cacheKey: string,
  storageMode: CachedGetOptions["storage"] = CLIENT_CACHE_STORAGE.PERSISTENT
) => {
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    if (isExpiredEntry(memoryEntry)) {
      removeClientCacheKey(cacheKey);
      return { found: false, value: undefined };
    }

    return { found: true, value: memoryEntry.value };
  }

  if (storageMode === CLIENT_CACHE_STORAGE.MEMORY) {
    return { found: false, value: undefined };
  }

  const storage = getStorage();
  if (!storage) {
    return { found: false, value: undefined };
  }

  const storedEntry = parseStoredEntry(storage.getItem(getEntryStorageKey(cacheKey)));
  if (!storedEntry) {
    removeEntryStorage(cacheKey);
    removeCacheKeyFromIndex(cacheKey);
    return { found: false, value: undefined };
  }

  if (isExpiredEntry(storedEntry)) {
    removeClientCacheKey(cacheKey);
    return { found: false, value: undefined };
  }

  memoryCache.set(cacheKey, storedEntry);
  return { found: true, value: storedEntry.value };
};

const writeClientCacheValue = (
  cacheKey: string,
  value: unknown,
  {
    storage = CLIENT_CACHE_STORAGE.PERSISTENT,
    ttlMs = DEFAULT_CACHE_TTL_MS,
    tags = []
  }: {
    storage?: CachedGetOptions["storage"];
    ttlMs?: number;
    tags?: string[];
  } = {}
) => {
  const normalizedTags = Array.from(
    new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || "").trim()).filter(Boolean))
  );
  const entry: CacheEntry = {
    createdAt: Date.now(),
    expiresAt: Date.now() + Math.max(1, Number(ttlMs) || DEFAULT_CACHE_TTL_MS),
    tags: normalizedTags,
    value
  };

  removeCacheKeyFromIndex(cacheKey, memoryCache.get(cacheKey)?.tags || []);
  memoryCache.set(cacheKey, entry);

  normalizedTags.forEach((tag) => {
    const keys = memoryTagIndex.get(tag) || new Set<string>();
    keys.add(cacheKey);
    memoryTagIndex.set(tag, keys);
  });

  if (storage === CLIENT_CACHE_STORAGE.PERSISTENT) {
    persistEntry(cacheKey, entry);
  } else {
    removeEntryStorage(cacheKey);
  }

  if (storage === CLIENT_CACHE_STORAGE.PERSISTENT && normalizedTags.length > 0) {
    const index = readTagIndex();
    normalizedTags.forEach((tag) => {
      const nextKeys = new Set(index[tag] || []);
      nextKeys.add(cacheKey);
      index[tag] = Array.from(nextKeys);
    });
    writeTagIndex(index);
  }
};

export const clearClientCache = () => {
  const storage = getStorage();
  const index = readTagIndex();

  Object.values(index)
    .flat()
    .forEach((cacheKey) => {
      removeEntryStorage(cacheKey);
    });

  if (storage) {
    try {
      storage.removeItem(CACHE_TAG_INDEX_KEY);
    } catch (_error) {
      // Ignore storage cleanup failures.
    }
  }

  memoryCache.clear();
  memoryTagIndex.clear();
};

export const invalidateClientCacheTags = (tags: string[] = []) => {
  const normalizedTags = Array.from(
    new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || "").trim()).filter(Boolean))
  );
  if (normalizedTags.length === 0) return;

  const index = readTagIndex();
  const cacheKeys = new Set<string>();

  normalizedTags.forEach((tag) => {
    (memoryTagIndex.get(tag) || new Set<string>()).forEach((cacheKey) => {
      cacheKeys.add(cacheKey);
    });
    (index[tag] || []).forEach((cacheKey) => {
      cacheKeys.add(cacheKey);
    });
  });

  cacheKeys.forEach((cacheKey) => {
    removeClientCacheKey(cacheKey);
  });
};

export const buildClientCacheKey = (url: string, params?: unknown) =>
  `${url}::${stableSerialize(params || {})}`;

export async function cachedGet<T = unknown>(
  url: string,
  requestConfig: Record<string, unknown> = {},
  cacheOptions: CachedGetOptions = {}
): Promise<T> {
  const {
    enabled = true,
    key,
    storage = CLIENT_CACHE_STORAGE.PERSISTENT,
    tags = [],
    ttlMs = DEFAULT_CACHE_TTL_MS
  } = cacheOptions;

  if (!enabled) {
    const { data } = await api.get<T>(url, requestConfig);
    return data;
  }

  const cacheKey = key || buildClientCacheKey(url, requestConfig?.params);
  const cached = readClientCacheValue(cacheKey, storage);

  if (cached.found) {
    return cached.value as T;
  }

  const { data } = await api.get<T>(url, requestConfig);
  writeClientCacheValue(cacheKey, data, { storage, ttlMs, tags });
  return data;
}

const invalidateAfterMutation = ({ invalidateTags = [] }: MutationOptions = {}) => {
  if (invalidateTags.length > 0) {
    invalidateClientCacheTags(invalidateTags);
  }
};

export async function postWithInvalidation<T = unknown>(
  url: string,
  payload?: unknown,
  options: MutationOptions & { requestConfig?: Record<string, unknown> } = {}
): Promise<T> {
  const { requestConfig, ...mutationOptions } = options;
  const { data } = await api.post<T>(url, payload, requestConfig);
  invalidateAfterMutation(mutationOptions);
  return data;
}

export async function putWithInvalidation<T = unknown>(
  url: string,
  payload?: unknown,
  options: MutationOptions & { requestConfig?: Record<string, unknown> } = {}
): Promise<T> {
  const { requestConfig, ...mutationOptions } = options;
  const { data } = await api.put<T>(url, payload, requestConfig);
  invalidateAfterMutation(mutationOptions);
  return data;
}

export async function deleteWithInvalidation<T = unknown>(
  url: string,
  requestConfig: Record<string, unknown> = {},
  options: MutationOptions = {}
): Promise<T> {
  const { data } = await api.delete<T>(url, requestConfig);
  invalidateAfterMutation(options);
  return data;
}
