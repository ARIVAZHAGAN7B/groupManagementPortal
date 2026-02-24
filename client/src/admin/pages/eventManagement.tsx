import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  activateEvent,
  archiveEvent,
  closeEvent,
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "../../service/events.api";

const EMPTY_FORM = {
  event_code: "",
  event_name: "",
  start_date: "",
  end_date: "",
  status: "ACTIVE",
  description: "",
};

const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];

const formatDate = (value: any): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED:   "bg-gray-100 text-gray-600 border-gray-200",
  INACTIVE: "bg-gray-100 text-gray-400 border-gray-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200",
};

const Badge = ({ value, map }: { value: string | null | undefined; map: Record<string, string> }) => {
  if (!value) return <span className="text-gray-300 text-xs">—</span>;
  const cls = map[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${cls}`}>
      {value}
    </span>
  );
};

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: string }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
    <p className={`text-xl font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition bg-white";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1";

export default function EventManagement() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEvents();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load events");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const onChangeField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        event_code: String(form.event_code || "").trim().toUpperCase(),
        event_name: String(form.event_name || "").trim(),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        description: String(form.description || "").trim(),
      };
      if (!payload.event_code || !payload.event_name) {
        throw new Error("Event code and event name are required");
      }
      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      resetForm();
      await loadEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: any) => {
    setEditingId(Number(row.event_id));
    setForm({
      event_code: row.event_code || "",
      event_name: row.event_name || "",
      start_date: row.start_date ? String(row.start_date).slice(0, 10) : "",
      end_date: row.end_date ? String(row.end_date).slice(0, 10) : "",
      status: row.status || "ACTIVE",
      description: row.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doRowAction = async (eventId: number, action: () => Promise<any>, confirmMessage?: string) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setActionBusyId(eventId);
    setError("");
    try {
      await action();
      await loadEvents();
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
      [row.event_id, row.event_code, row.event_name, row.status, row.description]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ")
        .includes(q)
    );
  }, [rows, query]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const row of rows) {
      const k = String(row?.status || "").toUpperCase();
      acc[k] = (acc[k] || 0) + 1;
    }
    return { total: rows.length, active: acc.ACTIVE || 0, closed: acc.CLOSED || 0, archived: acc.ARCHIVED || 0 };
  }, [rows]);

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Event Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Create events. Students will create teams inside active events.
          </p>
        </div>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors w-fit"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Active" value={counts.active} accent="text-emerald-600" />
        <StatCard label="Closed" value={counts.closed} accent="text-gray-500" />
        <StatCard label="Archived" value={counts.archived} accent="text-amber-600" />
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-900">
            {editingId ? `Editing Event #${editingId}` : "Create Event"}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className={labelCls}>Event Code</label>
            <input
              value={form.event_code}
              onChange={(e) => onChangeField("event_code", e.target.value)}
              className={inputCls}
              placeholder="HACK2026"
              maxLength={50}
            />
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>Event Name</label>
            <input
              value={form.event_name}
              onChange={(e) => onChangeField("event_name", e.target.value)}
              className={inputCls}
              placeholder="Hackathon 2026"
              maxLength={150}
            />
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => onChangeField("start_date", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => onChangeField("end_date", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(e) => onChangeField("status", e.target.value)}
              className={inputCls}
            >
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input
              value={form.description}
              onChange={(e) => onChangeField("description", e.target.value)}
              className={inputCls}
              placeholder="Short description…"
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : editingId ? "Update Event" : "Create Event"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Search */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
        placeholder="Search by code, name, status…"
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading events…</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1000px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Code", "Name", "Dates", "Status", "Teams", "Description", "Updated", "Actions"].map((h) => (
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
                const busy = actionBusyId === Number(row.event_id);
                return (
                  <tr key={row.event_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-gray-700">{row.event_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.event_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(row.start_date)} – {formatDate(row.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.status} map={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600 tabular-nums">
                      {Number(row.team_count || 0)}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="truncate text-xs text-gray-500" title={row.description || ""}>
                        {row.description || "—"}
                      </p>
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
                          onClick={() => doRowAction(Number(row.event_id), () => activateEvent(row.event_id))}
                          disabled={busy || row.status === "ACTIVE"}
                          className="px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(Number(row.event_id), () => closeEvent(row.event_id))}
                          disabled={busy || row.status === "CLOSED"}
                          className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(Number(row.event_id), () => archiveEvent(row.event_id), `Archive event ${row.event_code}?`)}
                          disabled={busy || row.status === "ARCHIVED"}
                          className="px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(Number(row.event_id), () => deleteEvent(row.event_id), `Set event ${row.event_code} to INACTIVE?`)}
                          disabled={busy || row.status === "INACTIVE"}
                          className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {busy ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                    No events found{query ? ` for "${query}"` : ""}.
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