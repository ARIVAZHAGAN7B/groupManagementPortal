import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  decideLeadershipRoleRequest,
  fetchAdminLeadershipNotifications,
  getAllPendingLeadershipRequests
} from "../../service/leadershipRequests.api";

const BADGE_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-gray-100 text-gray-600 border-gray-200",
  FROZEN: "bg-blue-50 text-blue-700 border-blue-200",
  CAPTAIN: "bg-blue-50 text-blue-700 border-blue-200",
  VICE_CAPTAIN: "bg-purple-50 text-purple-700 border-purple-200",
  STRATEGIST: "bg-indigo-50 text-indigo-700 border-indigo-200",
  MANAGER: "bg-amber-50 text-amber-700 border-amber-200",
  MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
  A: "bg-blue-50 text-blue-700 border-blue-200",
  B: "bg-purple-50 text-purple-700 border-purple-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-gray-100 text-gray-700 border-gray-200"
};

const Badge = ({ value }) => {
  const text = String(value || "-");
  const cls = BADGE_STYLES[text.toUpperCase()] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
};

const StatCard = ({ label, value, tone = "text-gray-900", subtext }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    <div className={`mt-2 text-lg font-bold ${tone}`}>{value}</div>
    {subtext ? <div className="mt-1 text-xs text-gray-500">{subtext}</div> : null}
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

export default function LeadershipRequestManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [groupFilter, setGroupFilter] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pendingRows, notificationSummary] = await Promise.all([
        getAllPendingLeadershipRequests(),
        fetchAdminLeadershipNotifications().catch(() => null)
      ]);
      setRows(Array.isArray(pendingRows) ? pendingRows : []);
      setNotifications(notificationSummary || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load leadership requests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const distinctGroups = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const key = String(row?.group_id ?? "");
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          group_id: row.group_id,
          group_name: row.group_name,
          group_code: row.group_code
        });
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (!groupFilter) return rows;
    return rows.filter((row) => String(row?.group_id) === String(groupFilter));
  }, [rows, groupFilter]);

  const groupsWithoutLeadership = useMemo(
    () => Number(notifications?.groups_without_leadership_count) || 0,
    [notifications]
  );
  const pendingCount = useMemo(() => rows.length, [rows.length]);

  const onDecision = async (row, status) => {
    const requestId = row?.leadership_request_id;
    if (!requestId) return;

    setDecisionBusyId(requestId);
    setError("");
    try {
      const reason =
        status === "APPROVED"
          ? "Approved leadership role request by admin"
          : "Rejected leadership role request by admin";

      await decideLeadershipRoleRequest(requestId, status, reason);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update leadership request");
    } finally {
      setDecisionBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Leadership Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Review pending leadership role requests and recover groups with no active leaders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Pending Requests"
          value={pendingCount}
          tone={pendingCount > 0 ? "text-amber-700" : "text-gray-900"}
          subtext="Across all groups"
        />
        <StatCard
          label="Groups Without Leaders"
          value={groupsWithoutLeadership}
          tone={groupsWithoutLeadership > 0 ? "text-red-700" : "text-gray-900"}
          subtext="Active members but no leadership roles"
        />
        <StatCard
          label="Unique Groups in Queue"
          value={distinctGroups.length}
          subtext="Groups with at least one pending role request"
        />
        <StatCard
          label="Shown Rows"
          value={visibleRows.length}
          subtext={groupFilter ? "Filtered by group" : "All pending rows"}
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Filter by Group
            </label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              disabled={loading}
            >
              <option value="">All groups</option>
              {distinctGroups.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.group_name || "Group"} ({group.group_code || group.group_id})
                </option>
              ))}
            </select>
          </div>

          {Array.isArray(notifications?.groups_without_leadership) &&
            notifications.groups_without_leadership.length > 0 && (
              <div>
                <div className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Groups Needing Leadership
                </div>
                <div className="flex flex-wrap gap-2">
                  {notifications.groups_without_leadership.map((group) => (
                    <button
                      key={`alert-group-${group.group_id}`}
                      type="button"
                      onClick={() => navigate(`/groups/${group.group_id}`)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100"
                      title={`Open group ${group.group_id}`}
                    >
                      {(group.group_name || group.group_code || `Group ${group.group_id}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {error ? (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-auto rounded-xl border border-gray-100">
        <table className="min-w-[1240px] w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                "Request ID",
                "Group",
                "Tier",
                "Group Status",
                "Student",
                "Requested Role",
                "Current Role",
                "Request Date",
                "Actions"
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  Loading leadership requests...
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                  No pending leadership role requests found.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.leadership_request_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                    {row.leadership_request_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{row.group_name || "-"}</div>
                    <div className="text-xs text-gray-500">
                      {row.group_code || "-"} | ID: {row.group_id || "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/groups/${row.group_id}`)}
                      className="mt-1 text-xs text-blue-600 hover:underline"
                    >
                      Open Group
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.group_tier || "-"} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.group_status || "-"} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{row.student_name || "-"}</div>
                    <div className="text-xs text-gray-500 font-mono">{row.student_id || "-"}</div>
                    <div className="text-xs text-gray-500">{row.student_email || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.requested_role || "-"} />
                    {row.request_reason ? (
                      <div className="mt-1 text-xs text-gray-500 max-w-[220px] break-words">
                        {row.request_reason}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.current_membership_role || "-"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDateTime(row.request_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDecision(row, "APPROVED")}
                        disabled={decisionBusyId === row.leadership_request_id}
                        className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {decisionBusyId === row.leadership_request_id ? "..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecision(row, "REJECTED")}
                        disabled={decisionBusyId === row.leadership_request_id}
                        className="px-3 py-1 rounded-md border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        {decisionBusyId === row.leadership_request_id ? "..." : "Reject"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

