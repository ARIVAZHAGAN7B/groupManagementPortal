import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  activateGroup,
  deleteGroup,
  fetchGroups,
  freezeGroup,
} from "../../../service/groups.api";

const TIER_STYLES = {
  A: "bg-blue-50 text-blue-700 border-blue-200",
  B: "bg-purple-50 text-purple-700 border-purple-200",
  C: "bg-orange-50 text-orange-700 border-orange-200",
  D: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_STYLES = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  FROZEN:   "bg-blue-50 text-blue-600 border-blue-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
};

const Badge = ({ value, map }) => {
  const cls = map[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cls}`}>
      {value}
    </span>
  );
};

export default function GroupManagementPage() {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) =>
      [g.group_code, g.group_name, g.tier, g.status]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(s))
    );
  }, [groups, q]);

  const doAction = async (fn, id) => {
    try {
      await fn(id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.error || "Action failed");
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Group Management</h1>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {filtered.length} {filtered.length === 1 ? "group" : "groups"}
              {q && " matched"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => nav("/groups/new")}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Create Group
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        placeholder="Search by code, name, tier, status…"
      />

      {/* Error */}
      {err && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading groups…</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[960px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["ID", "Code", "Name", "Tier", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((g) => (
                <tr key={g.group_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{g.group_id}</td>
                  <td className="px-4 py-3 text-xs font-mono font-medium text-gray-600">{g.group_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{g.group_name}</td>
                  <td className="px-4 py-3">
                    <Badge value={g.tier} map={TIER_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={g.status} map={STATUS_STYLES} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => nav(`/groups/${g.group_id}`)}
                        className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => nav(`/groups/${g.group_id}/edit`)}
                        className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => doAction(activateGroup, g.group_id)}
                        disabled={g.status === "ACTIVE"}
                        title="Set status ACTIVE"
                        className="px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Activate
                      </button>
                      <button
                        onClick={() => doAction(freezeGroup, g.group_id)}
                        disabled={g.status === "FROZEN"}
                        title="Set status FROZEN"
                        className="px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Freeze
                      </button>
                      <button
                        onClick={() => {
                          const ok = confirm("Soft delete (set INACTIVE)?");
                          if (ok) doAction(deleteGroup, g.group_id);
                        }}
                        title="Soft delete (INACTIVE)"
                        className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No groups found{q ? ` for "${q}"` : ""}.
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