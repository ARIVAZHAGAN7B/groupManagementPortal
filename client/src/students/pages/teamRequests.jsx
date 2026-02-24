import { useEffect, useMemo, useState } from "react";
import { fetchMyTeamMemberships } from "../../service/teams.api";
import {
  decideEventJoinRequest,
  getMyEventJoinRequests,
  getPendingEventJoinRequestsByTeam
} from "../../service/eventJoinRequests.api";

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const statusColor = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "text-green-700";
  if (s === "REJECTED") return "text-red-700";
  if (s === "PENDING") return "text-amber-700";
  return "text-gray-700";
};

export default function TeamRequestsPage() {
  const [activeTab, setActiveTab] = useState("my");
  const [myRequests, setMyRequests] = useState([]);
  const [captainTeams, setCaptainTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [pendingRows, setPendingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);

  const loadBase = async () => {
    setLoading(true);
    setError("");
    try {
      const [requests, myTeamsRes] = await Promise.all([
        getMyEventJoinRequests(),
        fetchMyTeamMemberships({ status: "ACTIVE" })
      ]);

      setMyRequests(Array.isArray(requests) ? requests : []);
      const memberships = Array.isArray(myTeamsRes?.memberships) ? myTeamsRes.memberships : [];
      const captains = memberships.filter(
        (row) => String(row?.role || "").toUpperCase() === "CAPTAIN"
      );
      setCaptainTeams(captains);
      setSelectedTeamId((prev) => {
        if (prev && captains.some((row) => String(row.team_id) === String(prev))) return prev;
        return captains[0] ? String(captains[0].team_id) : "";
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load team requests");
      setMyRequests([]);
      setCaptainTeams([]);
      setSelectedTeamId("");
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async (teamId) => {
    if (!teamId) {
      setPendingRows([]);
      return;
    }

    setLoadingPending(true);
    setPendingError("");
    try {
      const rows = await getPendingEventJoinRequestsByTeam(teamId);
      setPendingRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPendingError(err?.response?.data?.message || "Failed to load pending requests");
      setPendingRows([]);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (activeTab !== "captain") return;
    if (!selectedTeamId) return;
    loadPending(selectedTeamId);
  }, [activeTab, selectedTeamId]);

  const onDecision = async (requestId, status) => {
    setDecisionBusyId(requestId);
    setPendingError("");
    try {
      const reason =
        status === "APPROVED"
          ? "Approved by team captain"
          : "Rejected by team captain";
      await decideEventJoinRequest(requestId, status, reason);
      await Promise.all([loadPending(selectedTeamId), loadBase()]);
    } catch (err) {
      setPendingError(err?.response?.data?.message || "Failed to update request");
    } finally {
      setDecisionBusyId(null);
    }
  };

  const selectedCaptainTeam = useMemo(
    () => captainTeams.find((row) => String(row.team_id) === String(selectedTeamId)) || null,
    [captainTeams, selectedTeamId]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Team Requests</h1>
          <p className="text-sm text-gray-600">
            Track your event/team join requests and approve requests if you are a captain.
          </p>
        </div>
        <button onClick={loadBase} className="px-3 py-2 rounded border" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2 rounded border text-sm font-semibold ${
            activeTab === "my"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-gray-700"
          }`}
        >
          My Requests
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("captain")}
          className={`px-4 py-2 rounded border text-sm font-semibold ${
            activeTab === "captain"
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-white text-gray-700"
          }`}
        >
          Captain Inbox
        </button>
      </div>

      {error ? (
        <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="p-3 border rounded">Loading team requests...</div>
      ) : activeTab === "my" ? (
        <div className="overflow-auto border rounded">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 border-b">Request ID</th>
                <th className="text-left p-3 border-b">Event</th>
                <th className="text-left p-3 border-b">Team</th>
                <th className="text-left p-3 border-b">Type</th>
                <th className="text-left p-3 border-b">Team Status</th>
                <th className="text-left p-3 border-b">Request Date</th>
                <th className="text-left p-3 border-b">Status</th>
                <th className="text-left p-3 border-b">Decision By</th>
                <th className="text-left p-3 border-b">Reason</th>
                <th className="text-left p-3 border-b">Decision Date</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((row) => (
                <tr key={row.event_request_id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{row.event_request_id}</td>
                  <td className="p-3 border-b">
                    {row.event_id ? (
                      <div>
                        <div className="font-medium">{row.event_name || "-"}</div>
                        <div className="text-xs text-gray-500">
                          {row.event_code || "-"} | ID: {row.event_id}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No event</span>
                    )}
                  </td>
                  <td className="p-3 border-b">
                    <div className="font-medium">{row.team_name || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {row.team_code || "-"} | ID: {row.team_id}
                    </div>
                  </td>
                  <td className="p-3 border-b">{row.team_type || "-"}</td>
                  <td className="p-3 border-b">{row.team_status || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.request_date)}</td>
                  <td className={`p-3 border-b font-semibold ${statusColor(row.status)}`}>
                    {row.status || "-"}
                  </td>
                  <td className="p-3 border-b">
                    {row.decision_by_role ? `${row.decision_by_role}` : "-"}
                  </td>
                  <td className="p-3 border-b">{row.decision_reason || "-"}</td>
                  <td className="p-3 border-b">{formatDateTime(row.decision_date)}</td>
                </tr>
              ))}
              {myRequests.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={10}>
                    No event/team join requests found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {captainTeams.length === 0 ? (
            <div className="p-3 rounded border bg-gray-50 text-gray-700">
              You are not a captain in any active team.
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="w-full md:max-w-md">
                  <label className="block text-sm font-medium mb-1">Captain Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-white"
                  >
                    {captainTeams.map((row) => (
                      <option key={row.team_membership_id} value={row.team_id}>
                        {row.team_name} ({row.team_code}) | {row.team_type} | {row.event_code || "NO-EVENT"}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => loadPending(selectedTeamId)}
                  disabled={!selectedTeamId || loadingPending}
                  className="px-3 py-2 rounded border"
                >
                  {loadingPending ? "Loading..." : "Refresh Inbox"}
                </button>

                {selectedCaptainTeam ? (
                  <div className="text-sm text-gray-600">
                    Pending for <span className="font-semibold">{selectedCaptainTeam.team_name}</span>
                  </div>
                ) : null}
              </div>

              {pendingError ? (
                <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">
                  {pendingError}
                </div>
              ) : null}

              {loadingPending ? (
                <div className="p-3 border rounded">Loading pending requests...</div>
              ) : (
                <div className="overflow-auto border rounded">
                  <table className="min-w-[1200px] w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 border-b">Request ID</th>
                        <th className="text-left p-3 border-b">Student</th>
                        <th className="text-left p-3 border-b">Email</th>
                        <th className="text-left p-3 border-b">Department</th>
                        <th className="text-left p-3 border-b">Year</th>
                        <th className="text-left p-3 border-b">Request Date</th>
                        <th className="text-left p-3 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRows.map((row) => (
                        <tr key={row.event_request_id} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{row.event_request_id}</td>
                          <td className="p-3 border-b">
                            <div className="font-medium">{row.student_name || "-"}</div>
                            <div className="text-xs text-gray-500">ID: {row.student_id}</div>
                          </td>
                          <td className="p-3 border-b">{row.student_email || "-"}</td>
                          <td className="p-3 border-b">{row.department || "-"}</td>
                          <td className="p-3 border-b">{row.year ?? "-"}</td>
                          <td className="p-3 border-b">{formatDateTime(row.request_date)}</td>
                          <td className="p-3 border-b">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => onDecision(row.event_request_id, "APPROVED")}
                                disabled={decisionBusyId === row.event_request_id}
                                className="px-3 py-1 rounded border"
                              >
                                {decisionBusyId === row.event_request_id ? "Working..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDecision(row.event_request_id, "REJECTED")}
                                disabled={decisionBusyId === row.event_request_id}
                                className="px-3 py-1 rounded border"
                              >
                                {decisionBusyId === row.event_request_id ? "Working..." : "Reject"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pendingRows.length === 0 ? (
                        <tr>
                          <td className="p-3 text-gray-500" colSpan={7}>
                            No pending requests for this team.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
