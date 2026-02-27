import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  activateTeam,
  archiveTeam,
  createTeam,
  deleteTeam,
  fetchTeams,
  freezeTeam,
  updateTeam
} from "../../service/teams.api";

type ManagementScope = "TEAM" | "EVENT_GROUP";

type TeamManagementProps = {
  scope?: ManagementScope;
};

const EMPTY_FORM = {
  team_code: "",
  team_name: "",
  team_type: "TEAM",
  status: "ACTIVE",
  description: ""
};

const TEAM_TYPES = ["TEAM", "HUB", "SECTION"];
const TEAM_STATUSES = ["ACTIVE", "INACTIVE", "FROZEN", "ARCHIVED"];

const formatDate = (value: any): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FROZEN: "bg-blue-50 text-blue-600 border-blue-200",
  INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200"
};

const TYPE_STYLES: Record<string, string> = {
  TEAM: "bg-blue-50 text-blue-700 border-blue-200",
  HUB: "bg-purple-50 text-purple-700 border-purple-200",
  SECTION: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EVENT: "bg-orange-50 text-orange-700 border-orange-200"
};

const Badge = ({
  value,
  map
}: {
  value: string | null | undefined;
  map: Record<string, string>;
}) => {
  if (!value) return <span className="text-gray-300 text-xs">-</span>;
  const cls = map[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cls}`}
    >
      {value}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  accent
}: {
  label: string;
  value: number;
  accent?: string;
}) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
      {label}
    </p>
    <p className={`text-xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
  </div>
);

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition bg-white";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1";

export default function TeamManagement({ scope = "TEAM" }: TeamManagementProps) {
  const isEventGroupScope = scope === "EVENT_GROUP";
  const scopeLabel = isEventGroupScope ? "Event Group" : "Team";
  const scopeLabelPlural = isEventGroupScope ? "Event Groups" : "Teams";

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadTeams = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTeams(
        isEventGroupScope ? { team_type: "EVENT" } : { exclude_team_type: "EVENT" }
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to load ${scopeLabelPlural.toLowerCase()}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [isEventGroupScope]);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      team_type: isEventGroupScope ? "EVENT" : "TEAM"
    });
    setEditingId(null);
  };

  useEffect(() => {
    resetForm();
  }, [isEventGroupScope]);

  const onChangeField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        team_code: String(form.team_code || "").trim().toUpperCase(),
        team_name: String(form.team_name || "").trim(),
        team_type: isEventGroupScope ? "EVENT" : form.team_type,
        status: form.status,
        description: String(form.description || "").trim()
      };

      if (!payload.team_code || !payload.team_name) {
        throw new Error(`${scopeLabel} code and name are required`);
      }

      if (!editingId && isEventGroupScope) {
        throw new Error("Event groups are created from the student Event Groups page");
      }

      if (editingId) {
        await updateTeam(editingId, payload);
      } else {
        await createTeam(payload);
      }

      resetForm();
      await loadTeams();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          `Failed to save ${scopeLabel.toLowerCase()}`
      );
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: any) => {
    setEditingId(Number(row.team_id));
    setForm({
      team_code: row.team_code || "",
      team_name: row.team_name || "",
      team_type: isEventGroupScope ? "EVENT" : row.team_type || "TEAM",
      status: row.status || "ACTIVE",
      description: row.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doRowAction = async (
    teamId: number,
    action: () => Promise<any>,
    confirmMessage?: string
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setActionBusyId(teamId);
    setError("");
    try {
      await action();
      await loadTeams();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed");
    } finally {
      setActionBusyId(null);
    }
  };

  const filteredRows = useMemo(() => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.team_id,
        row.team_code,
        row.team_name,
        row.team_type,
        row.status,
        row.description,
        row.event_name,
        row.event_code
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [rows, query]);

  const counts = useMemo(() => {
    const byStatus = rows.reduce((acc: Record<string, number>, row) => {
      const key = String(row?.status || "").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      total: rows.length,
      active: byStatus.ACTIVE || 0,
      frozen: byStatus.FROZEN || 0,
      inactive: byStatus.INACTIVE || 0
    };
  }, [rows]);

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">{scopeLabelPlural} Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {isEventGroupScope
              ? "Manage event groups, status, and leadership-role changes. Configure targets in Phase Configuration."
              : "Create and manage regular teams, hubs, and sections."}
          </p>
        </div>
        <button
          onClick={loadTeams}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors w-fit"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Active" value={counts.active} accent="text-emerald-600" />
        <StatCard label="Frozen" value={counts.frozen} accent="text-blue-600" />
        <StatCard label="Inactive" value={counts.inactive} accent="text-gray-500" />
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-900">
            {editingId ? `Editing ${scopeLabel} #${editingId}` : `Create ${scopeLabel}`}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>{scopeLabel} Code</label>
            <input
              value={form.team_code}
              onChange={(e) => onChangeField("team_code", e.target.value)}
              className={inputCls}
              placeholder={isEventGroupScope ? "EVTGRP01" : "AIHUB"}
              maxLength={50}
            />
          </div>
          <div>
            <label className={labelCls}>{scopeLabel} Name</label>
            <input
              value={form.team_name}
              onChange={(e) => onChangeField("team_name", e.target.value)}
              className={inputCls}
              placeholder={isEventGroupScope ? "Hackathon Group Alpha" : "AI Hub"}
              maxLength={120}
            />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            {isEventGroupScope ? (
              <input value="EVENT" readOnly className={`${inputCls} bg-gray-50`} />
            ) : (
              <select
                value={form.team_type}
                onChange={(e) => onChangeField("team_type", e.target.value)}
                className={inputCls}
              >
                {TEAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(e) => onChangeField("status", e.target.value)}
              className={inputCls}
            >
              {TEAM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChangeField("description", e.target.value)}
            className={`${inputCls} min-h-[80px] resize-y`}
            placeholder={
              isEventGroupScope
                ? "Notes about event group scope and rules..."
                : "What this team does, scope, notes..."
            }
            maxLength={2000}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || (isEventGroupScope && !editingId)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : editingId ? `Update ${scopeLabel}` : `Create ${scopeLabel}`}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {isEventGroupScope && !editingId ? (
          <p className="text-xs text-amber-700">
            New event groups are created by students in active events. Admin can edit and manage
            existing event groups here.
          </p>
        ) : null}
      </form>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        placeholder={`Search ${scopeLabelPlural.toLowerCase()} by code, name, status...`}
      />

      {error && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">
          Loading {scopeLabelPlural.toLowerCase()}...
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1150px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Code",
                  "Name",
                  isEventGroupScope ? "Event" : "Type",
                  "Status",
                  "Description",
                  "Created",
                  "Updated",
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
              {filteredRows.map((row) => {
                const busy = actionBusyId === Number(row.team_id);
                return (
                  <tr key={row.team_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-gray-700">
                      {row.team_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.team_name}</td>
                    <td className="px-4 py-3">
                      {isEventGroupScope ? (
                        <div className="text-xs">
                          <div className="font-medium text-gray-700">{row.event_name || "-"}</div>
                          <div className="text-gray-500">{row.event_code || "-"}</div>
                        </div>
                      ) : (
                        <Badge value={row.team_type} map={TYPE_STYLES} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.status} map={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="truncate text-xs text-gray-500" title={row.description || ""}>
                        {row.description || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          disabled={busy}
                          className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(Number(row.team_id), () => activateTeam(row.team_id))}
                          disabled={busy || row.status === "ACTIVE"}
                          className="px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(Number(row.team_id), () => freezeTeam(row.team_id))}
                          disabled={busy || row.status === "FROZEN"}
                          className="px-2.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Freeze
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doRowAction(
                              Number(row.team_id),
                              () => archiveTeam(row.team_id),
                              `Archive ${scopeLabel.toLowerCase()} ${row.team_code}?`
                            )
                          }
                          disabled={busy || row.status === "ARCHIVED"}
                          className="px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doRowAction(
                              Number(row.team_id),
                              () => deleteTeam(row.team_id),
                              `Set ${scopeLabel.toLowerCase()} ${row.team_code} to INACTIVE?`
                            )
                          }
                          disabled={busy || row.status === "INACTIVE"}
                          className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {busy ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                    No {scopeLabelPlural.toLowerCase()} found{query ? ` for "${query}"` : ""}.
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
