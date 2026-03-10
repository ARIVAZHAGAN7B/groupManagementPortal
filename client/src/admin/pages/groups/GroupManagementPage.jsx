import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  activateGroup,
  deleteGroup,
  fetchGroups,
  freezeGroup,
} from "../../../service/groups.api";

const TIER_STYLES = {
  A: "border-blue-200 bg-blue-50 text-blue-700",
  B: "border-violet-200 bg-violet-50 text-violet-700",
  C: "border-amber-200 bg-amber-50 text-amber-700",
  D: "border-slate-200 bg-slate-100 text-slate-700",
};

const STATUS_STYLES = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FROZEN: "border-sky-200 bg-sky-50 text-sky-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
};

const badgeClass =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#7d95d8] focus:ring-2 focus:ring-[#d8e2ff]";

const titleFont = { fontFamily: "\"Georgia\", \"Times New Roman\", serif" };

const Badge = ({ value, map }) => {
  const normalized = String(value || "-").toUpperCase();
  const cls = map[normalized] || "border-slate-200 bg-slate-100 text-slate-600";
  return <span className={`${badgeClass} ${cls}`}>{String(value || "-")}</span>;
};

const StatCard = ({ label, value, tone = "text-slate-900" }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
  </div>
);

export default function GroupManagementPage() {
  const nav = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await fetchGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tierOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(groups) ? groups : [])
            .map((g) => String(g?.tier || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [groups]
  );

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(groups) ? groups : [])
            .map((g) => String(g?.status || "").toUpperCase())
            .filter(Boolean)
        )
      ).sort(),
    [groups]
  );

  const filtered = useMemo(() => {
    const search = String(q || "").trim().toLowerCase();
    return (Array.isArray(groups) ? groups : []).filter((g) => {
      const tier = String(g?.tier || "").toUpperCase();
      const status = String(g?.status || "").toUpperCase();

      if (tierFilter !== "ALL" && tier !== tierFilter) return false;
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (!search) return true;
      return [g.group_code, g.group_name, g.tier, g.status]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [groups, q, tierFilter, statusFilter]);

  const stats = useMemo(() => {
    const all = Array.isArray(groups) ? groups : [];
    return {
      total: all.length,
      active: all.filter((g) => String(g?.status || "").toUpperCase() === "ACTIVE").length,
      frozen: all.filter((g) => String(g?.status || "").toUpperCase() === "FROZEN").length,
      inactive: all.filter((g) => String(g?.status || "").toUpperCase() === "INACTIVE").length,
    };
  }, [groups]);

  const doAction = async (fn, id, confirmText = "") => {
    if (confirmText) {
      const ok = window.confirm(confirmText);
      if (!ok) return;
    }
    try {
      await fn(id);
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.error || "Action failed");
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 md:px-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-[#f6f9ff] via-[#f2f6ff] to-[#eaf1ff] p-5 shadow-[0_20px_35px_-30px_rgba(15,23,42,0.9)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Group Workspace
            </p>
            <h1 className="mt-1 text-3xl text-slate-900" style={titleFont}>
              Group Management
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Monitor, filter, and update all groups from one page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={() => nav("/groups/new")}
              className="inline-flex items-center rounded-xl border border-[#7d95d8] bg-[#e9efff] px-3.5 py-2 text-sm font-semibold text-[#23366f] transition hover:bg-[#dbe5ff]"
            >
              Create Group
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} tone="text-emerald-700" />
          <StatCard label="Frozen" value={stats.frozen} tone="text-sky-700" />
          <StatCard label="Inactive" value={stats.inactive} tone="text-slate-600" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={inputClass}
              placeholder="Search by code, name, tier, status"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Tier
            </label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className={inputClass}
            >
              <option value="ALL">All Tiers</option>
              {tierOptions.map((tier) => (
                <option key={tier} value={tier}>
                  Tier {tier}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="ALL">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-700">{stats.total}</span> groups
        </p>
      </section>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Loading groups...
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((g) => (
              <article
                key={g.group_id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_22px_-22px_rgba(15,23,42,0.9)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-slate-500">{g.group_code}</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{g.group_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">ID {g.group_id}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge value={g.tier} map={TIER_STYLES} />
                  <Badge value={g.status} map={STATUS_STYLES} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => nav(`/groups/${g.group_id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => nav(`/groups/${g.group_id}/edit`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => doAction(activateGroup, g.group_id)}
                    disabled={String(g.status).toUpperCase() === "ACTIVE"}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-40"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => doAction(freezeGroup, g.group_id)}
                    disabled={String(g.status).toUpperCase() === "FROZEN"}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 disabled:opacity-40"
                  >
                    Freeze
                  </button>
                </div>

                <button
                  onClick={() =>
                    doAction(
                      deleteGroup,
                      g.group_id,
                      "Set this group to INACTIVE (soft delete)?"
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Delete
                </button>
              </article>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                No groups found for current filters.
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-auto rounded-2xl border border-slate-200 bg-white shadow-[0_16px_30px_-28px_rgba(15,23,42,0.9)] md:block">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {["ID", "Code", "Name", "Tier", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g.group_id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{g.group_id}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {g.group_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{g.group_name}</td>
                    <td className="px-4 py-3">
                      <Badge value={g.tier} map={TIER_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={g.status} map={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => nav(`/groups/${g.group_id}`)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          onClick={() => nav(`/groups/${g.group_id}/edit`)}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => doAction(activateGroup, g.group_id)}
                          disabled={String(g.status).toUpperCase() === "ACTIVE"}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-40"
                        >
                          Activate
                        </button>
                        <button
                          onClick={() => doAction(freezeGroup, g.group_id)}
                          disabled={String(g.status).toUpperCase() === "FROZEN"}
                          className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 disabled:opacity-40"
                        >
                          Freeze
                        </button>
                        <button
                          onClick={() =>
                            doAction(
                              deleteGroup,
                              g.group_id,
                              "Set this group to INACTIVE (soft delete)?"
                            )
                          }
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      No groups found for current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
