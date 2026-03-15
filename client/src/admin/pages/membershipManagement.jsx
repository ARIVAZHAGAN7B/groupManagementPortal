import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteMembership, fetchAllMemberships } from "../../service/membership.api";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const ROLE_STYLES = {
  CAPTAIN:      "bg-blue-50 text-blue-700 border-blue-200",
  VICE_CAPTAIN: "bg-purple-50 text-purple-700 border-purple-200",
  STRATEGIST:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  MANAGER:      "bg-amber-50 text-amber-700 border-amber-200",
  MEMBER:       "bg-gray-100 text-gray-600 border-gray-200",
};

const MEMBERSHIP_STATUS_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LEFT:   "bg-gray-100 text-gray-500 border-gray-200",
  KICKED: "bg-red-50 text-red-600 border-red-200",
};

const TIER_STYLES = {
  A: "bg-blue-50 text-blue-700 border-blue-200",
  B: "bg-purple-50 text-purple-700 border-purple-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
};

const Badge = ({ value, map }) => {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const key = String(value).toUpperCase().replace(" ", "_");
  const cls = map?.[key] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cls}`}>
      {String(value).replace("_", " ")}
    </span>
  );
};

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
  </div>
);

export default function MembershipManagement() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [actionBusyId, setActionBusyId] = useState(null);
  const [removeDialog, setRemoveDialog] = useState({
    row: null,
    reason: "",
    error: ""
  });

  const loadMemberships = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllMemberships();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load memberships");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMemberships(); }, []);

  const onUpdate = (row) => {
    if (!row?.group_id) {
      setError("This membership is not linked to an active group.");
      return;
    }
    const params = new URLSearchParams();
    if (row.student_id != null) params.set("highlightStudentId", String(row.student_id));
    if (row.membership_id != null) params.set("highlightMembershipId", String(row.membership_id));
    nav(`/groups/${row.group_id}?${params.toString()}`);
  };

  const openRemoveDialog = (row) => {
    setRemoveDialog({
      row,
      reason: "",
      error: ""
    });
  };

  const closeRemoveDialog = () => {
    if (actionBusyId !== null) return;
    setRemoveDialog({
      row: null,
      reason: "",
      error: ""
    });
  };

  const onDelete = async () => {
    const row = removeDialog.row;
    if (!row?.membership_id) return;
    const reason = String(removeDialog.reason || "").trim();
    if (!reason) {
      setRemoveDialog((prev) => ({
        ...prev,
        error: "Removal reason is required."
      }));
      return;
    }

    setActionBusyId(row.membership_id);
    setError("");
    try {
      await deleteMembership(row.membership_id, reason);
      setRemoveDialog({
        row: null,
        reason: "",
        error: ""
      });
      await loadMemberships();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to mark membership as left";
      setRemoveDialog((prev) => ({
        ...prev,
        error: message
      }));
    } finally {
      setActionBusyId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.student_id, row.student_name, row.student_email,
        row.group_name, row.group_tier, row.role, row.membership_status,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [rows, query]);

  const activeCount = useMemo(
    () => rows.filter((row) => String(row.membership_status).toUpperCase() === "ACTIVE").length,
    [rows]
  );

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      {removeDialog.row ? (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/45 px-4"
          onClick={closeRemoveDialog}
        >
          <div
            className="w-[min(92vw,480px)] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900">Remove Membership</p>
                <p className="mt-1 text-sm text-gray-600">
                  Provide a reason for removing{" "}
                  <span className="font-semibold text-gray-900">
                    {removeDialog.row.student_name || removeDialog.row.student_id || "this member"}
                  </span>{" "}
                  from the group.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRemoveDialog}
                disabled={actionBusyId !== null}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="font-medium text-gray-900">
                {removeDialog.row.student_name || "—"}
              </div>
              <div className="mt-1 text-xs font-mono text-gray-500">
                {removeDialog.row.student_id || "—"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Group: {removeDialog.row.group_name || "—"}
              </div>
            </div>

            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
              Removal Reason
            </label>
            <textarea
              value={removeDialog.reason}
              onChange={(e) =>
                setRemoveDialog((prev) => ({
                  ...prev,
                  reason: e.target.value,
                  error: ""
                }))
              }
              disabled={actionBusyId !== null}
              rows={4}
              maxLength={500}
              placeholder="Explain why this membership is being removed."
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
              <span>Required for audit trail.</span>
              <span>{String(removeDialog.reason || "").length}/500</span>
            </div>

            {removeDialog.error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {removeDialog.error}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRemoveDialog}
                disabled={actionBusyId !== null}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={actionBusyId !== null || !String(removeDialog.reason || "").trim()}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {actionBusyId !== null ? "Removing..." : "Remove Membership"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Membership Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">View all membership records across groups.</p>
        </div>
        <button
          onClick={loadMemberships}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Memberships" value={rows.length} />
        <StatCard label="Active Memberships" value={activeCount} accent="text-emerald-600" />
        <StatCard label="Filtered Rows" value={filteredRows.length} accent={query ? "text-blue-600" : "text-gray-800"} />
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        placeholder="Search by student, group, role, status…"
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading memberships…</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[780px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Student", "Email", "Group", "Tier", "Role", "Status", "Joined", "Left", "Actions"].map((h) => (
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
              {filteredRows.map((row) => (
                <tr key={row.membership_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{row.student_name || "—"}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.student_id || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.student_email || "—"}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{row.group_name || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge value={row.group_tier} map={TIER_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.role} map={ROLE_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.membership_status} map={MEMBERSHIP_STATUS_STYLES} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(row.join_date)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(row.leave_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdate(row)}
                        disabled={!row.group_id || actionBusyId === row.membership_id}
                        className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => openRemoveDialog(row)}
                        disabled={
                          String(row.membership_status).toUpperCase() !== "ACTIVE" ||
                          actionBusyId === row.membership_id
                        }
                        className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionBusyId === row.membership_id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No memberships found{query ? ` for "${query}"` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
