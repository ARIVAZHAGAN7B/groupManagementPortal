import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  activateEvent,
  archiveEvent,
  closeEvent,
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent
} from "../../service/events.api";

type EventRow = {
  created_at?: string | null;
  description?: string | null;
  end_date?: string | null;
  event_code?: string | null;
  event_id: number;
  event_name?: string | null;
  location?: string | null;
  max_members?: number | null;
  min_members?: number | null;
  registration_end_date?: string | null;
  registration_link?: string | null;
  registration_start_date?: string | null;
  start_date?: string | null;
  status?: string | null;
  team_count?: number | null;
  updated_at?: string | null;
};

type EventFormState = {
  description: string;
  end_date: string;
  event_code: string;
  event_name: string;
  location: string;
  max_members: string;
  min_members: string;
  registration_end_date: string;
  registration_link: string;
  registration_start_date: string;
  start_date: string;
  status: string;
};

const EMPTY_FORM: EventFormState = {
  event_code: "",
  event_name: "",
  location: "",
  registration_link: "",
  start_date: "",
  end_date: "",
  registration_start_date: "",
  registration_end_date: "",
  min_members: "",
  max_members: "",
  status: "ACTIVE",
  description: ""
};

const EVENT_STATUSES = ["ACTIVE", "CLOSED", "INACTIVE", "ARCHIVED"];

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-blue-200";
const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
  INACTIVE: "bg-gray-100 text-gray-400 border-gray-200",
  ARCHIVED: "bg-amber-50 text-amber-700 border-amber-200"
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString();
};

const formatDateRange = (start: string | null | undefined, end: string | null | undefined) => {
  const values = [formatDate(start), formatDate(end)].filter((value) => value && value !== "-");
  return values.length > 0 ? values.join(" to ") : "-";
};

const formatMemberRange = (minValue: number | null | undefined, maxValue: number | null | undefined) => {
  const minMembers = Number(minValue);
  const maxMembers = Number(maxValue);
  const hasMin = Number.isInteger(minMembers) && minMembers > 0;
  const hasMax = Number.isInteger(maxMembers) && maxMembers > 0;

  if (hasMin && hasMax) return `${minMembers} - ${maxMembers}`;
  if (hasMin) return `Min ${minMembers}`;
  if (hasMax) return `Max ${maxMembers}`;
  return "-";
};

const Badge = ({
  value,
  map
}: {
  value: string | null | undefined;
  map: Record<string, string>;
}) => {
  if (!value) return <span className="text-xs text-gray-300">-</span>;
  const cls = map[String(value).toUpperCase()] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {value}
    </span>
  );
};

const toInputDate = (value: string | null | undefined) => (value ? String(value).slice(0, 10) : "");

const toInputNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export default function EventManagement() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

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

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const onChangeField = (key: keyof EventFormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        event_code: String(form.event_code || "").trim().toUpperCase(),
        event_name: String(form.event_name || "").trim(),
        location: String(form.location || "").trim(),
        registration_link: String(form.registration_link || "").trim(),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        registration_start_date: form.registration_start_date || null,
        registration_end_date: form.registration_end_date || null,
        min_members: form.min_members ? Number(form.min_members) : null,
        max_members: form.max_members ? Number(form.max_members) : null,
        status: form.status,
        description: String(form.description || "").trim()
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

  const onEdit = (row: EventRow) => {
    setEditingId(Number(row.event_id));
    setForm({
      event_code: row.event_code || "",
      event_name: row.event_name || "",
      location: row.location || "",
      registration_link: row.registration_link || "",
      start_date: toInputDate(row.start_date),
      end_date: toInputDate(row.end_date),
      registration_start_date: toInputDate(row.registration_start_date),
      registration_end_date: toInputDate(row.registration_end_date),
      min_members: toInputNumber(row.min_members),
      max_members: toInputNumber(row.max_members),
      status: row.status || "ACTIVE",
      description: row.description || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doRowAction = async (
    eventId: number,
    action: () => Promise<any>,
    confirmMessage?: string
  ) => {
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
    const normalizedQuery = String(query || "").trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      [
        row.event_id,
        row.event_code,
        row.event_name,
        row.location,
        row.registration_link,
        row.registration_start_date,
        row.registration_end_date,
        row.min_members,
        row.max_members,
        row.status,
        row.description
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ")
        .includes(normalizedQuery)
    );
  }, [rows, query]);

  return (
    <div className="max-w-screen-xl space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Event Management</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Manage event timelines, registration windows, and member limits.
          </p>
        </div>
        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
          className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-900">
            {editingId ? `Editing Event #${editingId}` : "Create Event"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={labelCls}>Event Code</label>
            <input
              value={form.event_code}
              onChange={(inputEvent) => onChangeField("event_code", inputEvent.target.value)}
              className={inputCls}
              placeholder="HACK2026"
              maxLength={50}
            />
          </div>

          <div className="xl:col-span-2">
            <label className={labelCls}>Event Name</label>
            <input
              value={form.event_name}
              onChange={(inputEvent) => onChangeField("event_name", inputEvent.target.value)}
              className={inputCls}
              placeholder="Hackathon 2026"
              maxLength={150}
            />
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input
              value={form.location}
              onChange={(inputEvent) => onChangeField("location", inputEvent.target.value)}
              className={inputCls}
              placeholder="Main Auditorium"
              maxLength={255}
            />
          </div>

          <div>
            <label className={labelCls}>Registration Link</label>
            <input
              value={form.registration_link}
              onChange={(inputEvent) =>
                onChangeField("registration_link", inputEvent.target.value)
              }
              className={inputCls}
              placeholder="https://example.com/register"
              maxLength={500}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(inputEvent) => onChangeField("start_date", inputEvent.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(inputEvent) => onChangeField("end_date", inputEvent.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Registration Start</label>
            <input
              type="date"
              value={form.registration_start_date}
              onChange={(inputEvent) =>
                onChangeField("registration_start_date", inputEvent.target.value)
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Registration End</label>
            <input
              type="date"
              value={form.registration_end_date}
              onChange={(inputEvent) =>
                onChangeField("registration_end_date", inputEvent.target.value)
              }
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelCls}>Min Members</label>
            <input
              type="number"
              min={1}
              value={form.min_members}
              onChange={(inputEvent) => onChangeField("min_members", inputEvent.target.value)}
              className={inputCls}
              placeholder="3"
            />
          </div>

          <div>
            <label className={labelCls}>Max Members</label>
            <input
              type="number"
              min={1}
              value={form.max_members}
              onChange={(inputEvent) => onChangeField("max_members", inputEvent.target.value)}
              className={inputCls}
              placeholder="6"
            />
          </div>

          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(inputEvent) => onChangeField("status", inputEvent.target.value)}
              className={inputCls}
            >
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(inputEvent) => onChangeField("description", inputEvent.target.value)}
            className={`${inputCls} min-h-28 resize-y`}
            placeholder="Event description for the detail page"
            maxLength={1000}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>

      <input
        value={query}
        onChange={(inputEvent) => setQuery(inputEvent.target.value)}
        className="w-full max-w-xl rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="Search by code, name, location, registration, members, or status"
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400">Loading events...</div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-100">
          <table className="min-w-[1320px] w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  "Code",
                  "Name",
                  "Location",
                  "Event Dates",
                  "Registration",
                  "Members",
                  "Status",
                  "Groups",
                  "Updated",
                  "Actions"
                ].map((header) => (
                  <th
                    key={header}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRows.map((row) => {
                const eventId = Number(row.event_id);
                const busy = actionBusyId === eventId;

                return (
                  <tr key={eventId} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                      {row.event_code || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.event_name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.location || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateRange(row.start_date, row.end_date)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateRange(row.registration_start_date, row.registration_end_date)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                      {formatMemberRange(row.min_members, row.max_members)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge value={row.status} map={STATUS_STYLES} />
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-600 tabular-nums">
                      {Number(row.team_count || 0)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(row.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/event-management/${eventId}`)}
                          title={`View ${row.event_name || "event"}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#1754cf]/15 bg-[#1754cf]/8 text-[#1754cf] transition hover:bg-[#1754cf]/12"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                        >
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(eventId, () => activateEvent(eventId))}
                          disabled={busy || row.status === "ACTIVE"}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => doRowAction(eventId, () => closeEvent(eventId))}
                          disabled={busy || row.status === "CLOSED"}
                          className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doRowAction(
                              eventId,
                              () => archiveEvent(eventId),
                              `Archive event ${row.event_code}?`
                            )
                          }
                          disabled={busy || row.status === "ARCHIVED"}
                          className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Archive
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            doRowAction(
                              eventId,
                              () => deleteEvent(eventId),
                              `Set event ${row.event_code} to INACTIVE?`
                            )
                          }
                          disabled={busy || row.status === "INACTIVE"}
                          className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busy ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                    No events found{query ? ` for "${query}"` : ""}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
