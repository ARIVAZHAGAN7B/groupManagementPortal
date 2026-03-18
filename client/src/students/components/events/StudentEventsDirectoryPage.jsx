import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEvents } from "../../../service/events.api";
import TeamPageFilters from "../teams/TeamPageFilters";
import TeamPageHero from "../teams/TeamPageHero";
import {
  TeamDesktopTableShell,
  TeamTableSearchField,
  TeamTableSelectField
} from "../teams/TeamDesktopTableControls";
import { formatLabel, formatShortDate, normalizeValue } from "../teams/teamPage.utils";
import EventDirectoryMobileCards from "./EventDirectoryMobileCards";
import EventDirectoryTable from "./EventDirectoryTable";
import {
  EVENT_STATUS_OPTIONS,
  getEventLocationLabel,
  getEventMemberLimitLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationStatus
} from "./events.constants";

const inputClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const selectClassName =
  "w-full rounded-2xl border border-slate-300 bg-[#f3f4f6] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#1754cf]/35 focus:ring-2 focus:ring-[#1754cf]/10";

const getLatestDateLabel = (rows, fieldName) => {
  const timestamps = (Array.isArray(rows) ? rows : [])
    .map((row) => new Date(row?.[fieldName]).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return "No date";
  return formatShortDate(new Date(Math.max(...timestamps)));
};

export default function StudentEventsDirectoryPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const eventRows = await fetchEvents();
      setRows(Array.isArray(eventRows) ? eventRows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load events");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((event) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          event.event_code,
          event.event_name,
          event.location,
          event.status,
          event.description,
          event.registration_link,
          event.registration_start_date,
          event.registration_end_date,
          event.min_members,
          event.max_members,
          getEventMemberLimitLabel(event),
          getEventRegistrationDateRangeLabel(event),
          getEventRegistrationStatus(event).label,
          getEventLocationLabel(event),
          event.start_date,
          event.end_date
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || normalizeValue(event.status) === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }

    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }

    return items;
  }, [query, statusFilter]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
  }, []);

  const activeEventCount = useMemo(
    () => rows.filter((event) => normalizeValue(event.status) === "ACTIVE").length,
    [rows]
  );

  const totalGroupCount = useMemo(
    () => rows.reduce((sum, event) => sum + (Number(event.team_count) || 0), 0),
    [rows]
  );

  const latestEndingLabel = useMemo(() => getLatestDateLabel(rows, "end_date"), [rows]);
  const openRegistrationCount = useMemo(
    () => rows.filter((event) => getEventRegistrationStatus(event).isOpen).length,
    [rows]
  );

  const headerSummary =
    filteredRows.length !== rows.length
      ? `Showing ${filteredRows.length} of ${rows.length} events`
      : `${rows.length} events currently available`;

  const handleViewEvent = useCallback(
    (event) => {
      if (!event?.event_id) return;
      navigate(`/events/${event.event_id}`);
    },
    [navigate]
  );

  return (
    <div className="max-w-screen-2xl space-y-3 p-4 md:p-5">
      <TeamPageHero
        loading={loading}
        onRefresh={load}
        eyebrow="Events Directory"
        title="Events"
        summary={headerSummary}
        actionLabel="Refresh events"
        actionBusyLabel="Refreshing..."
        stats={[
          {
            accentClass: "bg-[#1754cf]",
            detail: "Events currently listed for students",
            label: "Events",
            value: rows.length
          },
          {
            accentClass: "bg-emerald-500",
            detail: "Events that are ready for active participation",
            label: "Active",
            value: activeEventCount
          },
          {
            accentClass: "bg-sky-500",
            detail: "Total event groups registered across all events",
            label: "Registered Groups",
            value: totalGroupCount
          },
          {
            accentClass: "bg-slate-400",
            detail: latestEndingLabel === "No date" ? "No event end dates yet" : "Latest visible event end date",
            label: "Latest End",
            value: latestEndingLabel
          },
          {
            accentClass: "bg-amber-500",
            detail: "Events with an open registration window",
            label: "Registration Open",
            value: openRegistrationCount
          }
        ]}
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <TeamPageFilters
          className="lg:hidden"
          activeFilters={activeFilters}
          canReset={activeFilters.length > 0}
          itemLabel="events"
          onReset={resetFilters}
          panelTitle="Filter Events"
          resultCount={filteredRows.length}
          totalCount={rows.length}
          withDivider
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Search
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by event, location, registration, members, or status"
              className={inputClassName}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={selectClassName}
            >
              <option value="ALL">All statuses</option>
              {EVENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </TeamPageFilters>

        <EventDirectoryMobileCards
          rows={filteredRows}
          loading={loading}
          onView={handleViewEvent}
        />
      </section>

      <TeamDesktopTableShell
        canReset={activeFilters.length > 0}
        onReset={resetFilters}
        toolbar={
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="min-w-0 xl:w-[22rem]">
              <TeamTableSearchField
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by event, location, registration, members, or status"
              />
            </div>

            <div className="min-w-0 xl:w-44">
              <TeamTableSelectField
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                {EVENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </TeamTableSelectField>
            </div>
          </div>
        }
      >
        <EventDirectoryTable
          rows={filteredRows}
          loading={loading}
          onView={handleViewEvent}
        />
      </TeamDesktopTableShell>
    </div>
  );
}
