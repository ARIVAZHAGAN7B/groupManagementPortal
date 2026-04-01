import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation,
  deleteWithInvalidation
} from "../lib/api";

const SYSTEM_CONFIG_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.SYSTEM_CONFIG,
  CLIENT_CACHE_TAGS.HOLIDAYS,
  CLIENT_CACHE_TAGS.PHASES
];

export async function fetchOperationalPolicy() {
  return cachedGet("/api/system-config/policy", {}, {
    tags: [CLIENT_CACHE_TAGS.SYSTEM_CONFIG],
    ttlMs: CLIENT_CACHE_TTL.LONG
  });
}

export async function updateOperationalPolicy(payload) {
  return putWithInvalidation("/api/system-config/policy", payload, {
    invalidateTags: SYSTEM_CONFIG_INVALIDATION_TAGS
  });
}

export async function fetchIncubationConfig() {
  return cachedGet("/api/system-config/incubation", {}, {
    tags: [CLIENT_CACHE_TAGS.SYSTEM_CONFIG],
    ttlMs: CLIENT_CACHE_TTL.LONG
  });
}

export async function updateIncubationConfig(payload) {
  return putWithInvalidation("/api/system-config/incubation", payload, {
    invalidateTags: SYSTEM_CONFIG_INVALIDATION_TAGS
  });
}

export async function fetchHolidays() {
  const data = await cachedGet("/api/system-config/holidays", {}, {
    tags: [CLIENT_CACHE_TAGS.HOLIDAYS],
    ttlMs: CLIENT_CACHE_TTL.LONG
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchHolidayById(holidayId) {
  return cachedGet(`/api/system-config/holidays/${holidayId}`, {}, {
    tags: [CLIENT_CACHE_TAGS.HOLIDAYS],
    ttlMs: CLIENT_CACHE_TTL.LONG
  });
}

export async function createHoliday(payload) {
  return postWithInvalidation("/api/system-config/holidays", payload, {
    invalidateTags: SYSTEM_CONFIG_INVALIDATION_TAGS
  });
}

export async function updateHoliday(holidayId, payload) {
  return putWithInvalidation(`/api/system-config/holidays/${holidayId}`, payload, {
    invalidateTags: SYSTEM_CONFIG_INVALIDATION_TAGS
  });
}

export async function deleteHoliday(holidayId) {
  return deleteWithInvalidation(`/api/system-config/holidays/${holidayId}`, {}, {
    invalidateTags: SYSTEM_CONFIG_INVALIDATION_TAGS
  });
}
