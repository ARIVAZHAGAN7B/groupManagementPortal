import { api } from "../lib/api";

export async function joinGroup(groupId, role) {
  const { data } = await api.post(`/api/membership/join/${groupId}`, role ? { role } : {});
  return data;
}

export async function leaveGroup(groupId) {
  const { data } = await api.post("/api/membership/leave", { groupId });
  return data;
}

export async function fetchGroupMembers(groupId) {
  const { data } = await api.get(`/api/membership/group/${groupId}`);
  return data; // array
}

export async function fetchMyGroup() {
  const { data } = await api.get("/api/membership/my-group");
  return data; // { group }
}

export async function fetchAllMemberships() {
  const { data } = await api.get("/api/membership");
  return data; // array
}

export async function deleteMembership(membershipId) {
  const { data } = await api.delete(`/api/membership/${membershipId}`);
  return data;
}

export async function updateMemberRole(membershipId, role) {
  const { data } = await api.put(`/api/membership/${membershipId}/role`, { role });
  return data;
}
