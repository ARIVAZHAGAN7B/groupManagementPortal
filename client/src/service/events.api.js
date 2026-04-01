import {
  CLIENT_CACHE_TAGS,
  CLIENT_CACHE_TTL,
  cachedGet,
  postWithInvalidation,
  putWithInvalidation,
  deleteWithInvalidation
} from "../lib/api";

const EVENT_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.EVENTS,
  CLIENT_CACHE_TAGS.TEAMS,
  CLIENT_CACHE_TAGS.TEAM_MEMBERSHIPS
];

export async function fetchEvents() {
  const data = await cachedGet("/api/events", {}, {
    tags: [CLIENT_CACHE_TAGS.EVENTS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchEventById(id) {
  return cachedGet(`/api/events/${id}`, {}, {
    tags: [CLIENT_CACHE_TAGS.EVENTS],
    ttlMs: CLIENT_CACHE_TTL.MEDIUM
  });
}

export async function createEvent(payload) {
  return postWithInvalidation("/api/events", payload, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}

export async function updateEvent(id, payload) {
  return putWithInvalidation(`/api/events/${id}`, payload, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}

export async function activateEvent(id) {
  return putWithInvalidation(`/api/events/${id}/activate`, undefined, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}

export async function closeEvent(id) {
  return putWithInvalidation(`/api/events/${id}/close`, undefined, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}

export async function archiveEvent(id) {
  return putWithInvalidation(`/api/events/${id}/archive`, undefined, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}

export async function deleteEvent(id) {
  return deleteWithInvalidation(`/api/events/${id}`, {}, {
    invalidateTags: EVENT_INVALIDATION_TAGS
  });
}
