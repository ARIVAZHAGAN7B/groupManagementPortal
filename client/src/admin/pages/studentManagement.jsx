import { useEffect, useMemo, useState } from "react";
import { fetchAdminStudentOverview } from "../../service/eligibility.api";

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

const GROUP_STATUS_STYLES = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  FROZEN:   "bg-blue-50 text-blue-600 border-blue-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
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

const StatCard = ({ label, value, accent, sub }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
    {sub && <p className="text-[10.5px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default function StudentManagement() {
  const [rows, setRows] = useState([]);
  const [phase, setPhase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminStudentOverview();
      setRows(Array.isArray(data?.students) ? data.students : []);
      setPhase(data?.phase || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load student management data");
      setRows([]);
      setPhase(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.student_id, row.name, row.email, row.department, row.year,
        row.group_code, row.group_name, row.group_tier,
        row.group_status, row.membership_role, row.membership_status,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [rows, query]);

  const stats = useMemo(() => {
    const totalStudents = rows.length;
    const inGroup = rows.filter((row) => !!row.group_id).length;
    const totalBasePoints = rows.reduce((sum, row) => sum + (Number(row.total_base_points) || 0), 0);
    const totalPhasePoints = rows.reduce((sum, row) => sum + (Number(row.this_phase_base_points) || 0), 0);
    return { totalStudents, inGroup, totalBasePoints, totalPhasePoints };
  }, [rows]);

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Student Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            All students with current group, total base points, and current phase points.
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            {phase?.phase_id
              ? `Active phase: ${formatDate(phase.start_date)} – ${formatDate(phase.end_date)}`
              : "No active phase — phase points shown as 0."}
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={stats.totalStudents} />
        <StatCard label="In Groups" value={stats.inGroup} accent="text-blue-600" sub={`${stats.totalStudents - stats.inGroup} ungrouped`} />
        <StatCard label="Total Base Points" value={stats.totalBasePoints.toLocaleString()} />
        <StatCard label="This Phase Points" value={stats.totalPhasePoints.toLocaleString()} accent="text-indigo-600" />
      </div>

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        placeholder="Search by student, group, tier, status…"
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading students…</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Student", "Email", "Dept", "Year",
                  "Group", "Tier", "Role", "Group Status",
                  "Base Points", "Phase Points", "Joined",
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
              {filteredRows.map((row) => (
                <tr key={String(row.student_id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{row.name || "—"}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.student_id}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.department || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.year ?? "—"}</td>
                  <td className="px-4 py-3">
                    {row.group_id ? (
                      <>
                        <div className="font-medium text-gray-800">{row.group_name || "—"}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{row.group_code || "—"}</div>
                      </>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">No group</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.group_tier} map={TIER_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.membership_role} map={ROLE_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={row.group_status || row.membership_status} map={GROUP_STATUS_STYLES} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700 tabular-nums">
                    {(Number(row.total_base_points) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-indigo-600 tabular-nums">
                    {(Number(row.this_phase_base_points) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(row.join_date)}
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">
                    No students found{query ? ` for "${query}"` : ""}.
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