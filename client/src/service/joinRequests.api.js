import {
  api,
  CLIENT_CACHE_TAGS,
  postWithInvalidation,
  putWithInvalidation
} from "../lib/api";

const JOIN_REQUEST_INVALIDATION_TAGS = [
  CLIENT_CACHE_TAGS.GROUPS,
  CLIENT_CACHE_TAGS.GROUP_MEMBERSHIPS,
  CLIENT_CACHE_TAGS.GROUP_RANKS,
  CLIENT_CACHE_TAGS.LEADERBOARDS,
  CLIENT_CACHE_TAGS.GROUP_ELIGIBILITY,
  CLIENT_CACHE_TAGS.TEAM_TIER_CHANGE
];

export async function applyJoinRequest(groupId) {
  return postWithInvalidation("/api/join-requests/apply", { group_id: groupId });
}

export async function getMyJoinRequests() {
  const { data } = await api.get("/api/join-requests/my");
  return data;
}

export async function getPendingRequestsByGroup(groupId) {
  const { data } = await api.get(`/api/join-requests/group/${groupId}/pending`);
  return data;
}

export async function decideJoinRequest(requestId, status, decision_reason, approved_role) {
  return putWithInvalidation(`/api/join-requests/${requestId}/decision`, {
    status,
    decision_reason,
    ...(approved_role ? { approved_role } : {})
  }, {
    invalidateTags: JOIN_REQUEST_INVALIDATION_TAGS
  });
}

export async function getStudentIdByUserId() {
  try {
    const { data } = await api.get("/api/join-requests/student-id");
    return data.student_id;
  } catch (_error) {
    return null;
  }
};


export async function getNameByUserId() {
  try {
    const { data } = await api.get("/api/profile");
    return data.name;
  } catch (_error) {
    return null;
  }
};

export async function getAdminIdByUserId() {
  try {
    const { data } = await api.get("/api/join-requests/admin-id");
    return data.admin_id;
  } catch (_error) {
    return null;
  }
};

export async function getProfile() {
  try {
    const { data } = await api.get("/api/profile", {
      withCredentials: true
    });
    return data;
  } catch (_error) {
    return null;
  }
}
