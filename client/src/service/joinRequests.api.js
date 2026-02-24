import { api } from "../lib/api";

export async function applyJoinRequest(groupId) {
  const { data } = await api.post("/api/join-requests/apply", { group_id: groupId });
  return data;
}

export async function getMyJoinRequests() {
  const { data } = await api.get("/api/join-requests/my");
  return data;
}

export async function getPendingRequestsByGroup(groupId) {
  const { data } = await api.get(`/api/join-requests/group/${groupId}/pending`);
  return data;
}

export async function decideJoinRequest(requestId, status, decision_reason) {
  const { data } = await api.put(`/api/join-requests/${requestId}/decision`, {
    status,
    decision_reason,
  });
  return data;
}

export async function getStudentIdByUserId() {
  try {
    const { data } = await api.get("/api/join-requests/student-id");
    return data.student_id;
  } catch (error) {
    console.error("Error fetching student ID:", error);
    return null;
  }
};


export async function getNameByUserId() {
  try {
    const { data } = await api.get("/api/profile");
    return data.name;
  } catch (error) {
    console.error("Error fetching student name:", error);
    return null;
  }
};

export async function getAdminIdByUserId() {
  try {
    const { data } = await api.get("/api/join-requests/admin-id");
    return data.admin_id;
  } catch (error) {
    console.error("Error fetching admin ID:", error);
    return null;
  }
};

export async function getProfile() {
  try {
    const { data } = await api.get("/api/profile", {
      withCredentials: true
    });
    console.log("Profile data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}
