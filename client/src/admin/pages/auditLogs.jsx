import React, { useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { REALTIME_EVENTS } from "../../lib/realtime";
import { fetchAuditLogs } from "../../service/audit.api";

const PRESET_FILTERS = [
  { id: "all", label: "All Events", filter: {} },
  { id: "auth", label: "Authentication", filter: { action: "LOGIN" } },
  { id: "od", label: "On-Duty Requests", filter: { entity_type: "on_duty_requests" } },
  { id: "groups", label: "Squads & Teams", filter: { entity_type: "sgroup" } },
  { id: "phases", label: "Phase Governance", filter: { entity_type: "phases" } },
  { id: "points", label: "Points & Eligibility", filter: { action: "POINTS" } }
];

const emptyFilters = {
  q: "",
  action: "",
  entity_type: "",
  actor_role: "",
  actor_user_id: "",
  from_date: "",
  to_date: ""
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const formatRoleLabel = (role) => {
  if (!role) return "User";
  return String(role)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getActionTone = (action) => {
  const norm = String(action || "").toUpperCase();
  if (norm.includes("REJECT") || norm.includes("REMOVE") || norm.includes("DELETE") || norm.includes("FREEZE")) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60";
  }
  if (norm.includes("APPROVE") || norm.includes("CREATE") || norm.includes("JOIN") || norm.includes("ACTIVATE") || norm.includes("SUCCESS")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60";
  }
  if (norm.includes("PENDING") || norm.includes("APPLIED") || norm.includes("UPDATE")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60";
  }
  return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60";
};

// Copy helper with feedback
function CopyBadge({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label || text}`}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[11px] text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
    >
      <span>{text}</span>
      {copied ? (
        <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">✓</span>
      ) : (
        <svg className="h-3 w-3 opacity-60 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

// Side Drawer for deep JSON inspection
function AuditDetailsDrawer({ log, onClose }) {
  const [copiedJson, setCopiedJson] = useState(false);

  if (!log) return null;

  const jsonString = JSON.stringify(log.details || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-slate-900 dark:border-l dark:border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionTone(log.action)}`}>
                {log.action}
              </span>
              <span className="text-xs text-slate-400 font-mono">#{log.audit_id}</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              Event Payload & Metadata
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Timestamp</span>
              <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(log.created_at)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client IP</span>
              <p className="mt-1 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{log.ip_address || "Internal/Local"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Entity</span>
              <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                {log.entity_type} <span className="font-mono text-indigo-600 dark:text-indigo-400">({log.entity_id || "-"})</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reason / Code</span>
              <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{log.reason_code || "Normal Operation"}</p>
            </div>
          </div>

          {/* Actor Profile */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Actor Identity</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {(log.actor_name || "U")[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.actor_name || "System"}</p>
                <p className="text-xs text-slate-500">{formatRoleLabel(log.actor_role)} • ID: <CopyBadge text={log.actor_user_id} /></p>
              </div>
            </div>
          </div>

          {/* Syntax-Highlighted JSON Payload */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Structured Payload</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {copiedJson ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Copied to Clipboard</span>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy JSON
                  </>
                )}
              </button>
            </div>
            <pre className="max-h-96 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-400 leading-relaxed dark:border-slate-800">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-200 p-4 text-right dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [activePreset, setActivePreset] = useState("all");
  const [data, setData] = useState({ page: 1, limit: 50, total: 0, rows: [] });
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [liveStreamCount, setLiveStreamCount] = useState(0);

  const loadLogs = async (nextPage = data.page, nextLimit = data.limit, activeFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: nextPage,
        limit: nextLimit,
        ...Object.fromEntries(
          Object.entries(activeFilters).filter(([, v]) => v !== undefined && v !== null && v !== "")
        )
      };
      const response = await fetchAuditLogs(params);
      setData({
        page: response.page || nextPage,
        limit: response.limit || nextLimit,
        total: response.total || 0,
        rows: response.rows || []
      });
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebouncedCallback((val) => {
    setFilters((prev) => {
      const next = { ...prev, q: val };
      void loadLogs(1, data.limit, next);
      return next;
    });
  }, 350);

  useEffect(() => {
    void loadLogs(1, data.limit);
  }, []);

  // Realtime Socket listener
  useRealtimeEvents([REALTIME_EVENTS.AUDIT], () => {
    setLiveStreamCount((prev) => prev + 1);
    void loadLogs(data.page, data.limit, filters);
  });

  // KPI Calculations
  const stats = useMemo(() => {
    const total = data.total || 0;
    const rows = data.rows || [];
    const authCount = rows.filter((r) => String(r.action).includes("LOGIN") || String(r.action).includes("AUTH")).length;
    const approvalCount = rows.filter((r) => String(r.action).includes("APPROVE") || String(r.action).includes("CREATE")).length;
    const criticalCount = rows.filter((r) => String(r.action).includes("REJECT") || String(r.action).includes("FREEZE") || String(r.action).includes("DELETE")).length;
    return { total, authCount, approvalCount, criticalCount };
  }, [data]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data.rows?.length) return;
    const headers = ["Audit ID", "Timestamp", "Action", "Entity Type", "Entity ID", "Actor Name", "Actor Role", "IP Address", "Reason"];
    const rows = data.rows.map((r) => [
      r.audit_id,
      r.created_at,
      r.action,
      r.entity_type,
      r.entity_id || "",
      r.actor_name || "",
      r.actor_role || "",
      r.ip_address || "",
      r.reason_code || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pageCount = Math.max(1, Math.ceil((data.total || 0) / (data.limit || 50)));

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 font-[Inter] sm:px-6 lg:px-8">
      {/* 1. Header Title & Live Stream Status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Socket Sync
            </span>
            {liveStreamCount > 0 && (
              <span className="text-xs font-medium text-slate-500">
                +{liveStreamCount} events this session
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            System & Security Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            Immutable system activity trails, user authentications, and governance authorizations.
          </p>
        </div>

        {/* Global Export & Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!data.rows?.length}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadLogs(data.page, data.limit)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* 2. KPI Telemetry Summary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Recorded Logs</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{data.total.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">Indexed in database</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Security & Logins</p>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.authCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">In current page view</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Approvals & Creates</p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approvalCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Positive transitions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Critical / Rejections</p>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">{stats.criticalCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Freezes & rejections</p>
        </div>
      </div>

      {/* 3. Filter Bar & Preset Pills */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter Preset:</span>
          {PRESET_FILTERS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setActivePreset(preset.id);
                  const nextFilters = { ...emptyFilters, ...preset.filter };
                  setFilters(nextFilters);
                  void loadLogs(1, data.limit, nextFilters);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Detailed Search Filters */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Search text</label>
            <input
              type="text"
              placeholder="Search actor, action, reason..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Entity Type</label>
            <input
              type="text"
              placeholder="e.g. sgroup, users, phases..."
              value={filters.entity_type}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((p) => ({ ...p, entity_type: val }));
                debouncedSearch(val);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">Actor Role</label>
            <select
              value={filters.actor_role}
              onChange={(e) => {
                const val = e.target.value;
                const next = { ...filters, actor_role: val };
                setFilters(next);
                void loadLogs(1, data.limit, next);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
              <option value="ADMIN">Faculty / Admin</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setFilters(emptyFilters);
                setActivePreset("all");
                void loadLogs(1, data.limit, emptyFilters);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850">
              <tr>
                <th className="px-5 py-3.5 font-bold">Timestamp</th>
                <th className="px-5 py-3.5 font-bold">Action</th>
                <th className="px-5 py-3.5 font-bold">Entity</th>
                <th className="px-5 py-3.5 font-bold">Actor</th>
                <th className="px-5 py-3.5 font-bold">IP & Client</th>
                <th className="px-5 py-3.5 font-bold">Reason</th>
                <th className="px-5 py-3.5 text-right font-bold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading audit events...
                    </div>
                  </td>
                </tr>
              ) : data.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr
                    key={row.audit_id}
                    onClick={() => setSelectedLog(row)}
                    className="cursor-pointer transition hover:bg-slate-50/80 dark:hover:bg-slate-850/60"
                  >
                    {/* Timestamp */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {formatDateTime(row.created_at)}
                    </td>

                    {/* Action Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getActionTone(row.action)}`}>
                        {row.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{row.entity_type}</div>
                      {row.entity_id && (
                        <div className="mt-0.5">
                          <CopyBadge text={String(row.entity_id)} />
                        </div>
                      )}
                    </td>

                    {/* Actor Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {(row.actor_name || "U")[0]}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{row.actor_name || "System"}</span>
                          <span className="ml-1.5 text-[10px] text-slate-400">({formatRoleLabel(row.actor_role)})</span>
                        </div>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {row.ip_address || "Internal"}
                    </td>

                    {/* Reason */}
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate dark:text-slate-400">
                      {row.reason_code || "-"}
                    </td>

                    {/* Details button */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(row);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600 shadow-2xs hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-slate-750"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Toolbar */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3.5 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="text-slate-500">
            Showing <strong className="text-slate-900 dark:text-white">{data.rows.length ? (data.page - 1) * data.limit + 1 : 0}</strong> to{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(data.page * data.limit, data.total)}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{data.total.toLocaleString()}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={loading || data.page <= 1}
              onClick={() => void loadLogs(data.page - 1, data.limit)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-slate-900 dark:text-white">
              Page {data.page} of {pageCount}
            </span>
            <button
              disabled={loading || data.page >= pageCount}
              onClick={() => void loadLogs(data.page + 1, data.limit)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Next
            </button>

            <select
              value={data.limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value) || 50;
                void loadLogs(1, newLimit);
              }}
              className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {[25, 50, 100, 200].map((l) => (
                <option key={l} value={l}>
                  {l} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Side Drawer for Detailed Payload Inspection */}
      <AuditDetailsDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
