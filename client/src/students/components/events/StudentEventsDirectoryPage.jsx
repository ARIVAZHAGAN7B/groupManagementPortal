import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField
} from "../../../admin/components/ui/AdminFilterControls";
import { fetchEvents } from "../../../service/events.api";
import TeamPageHero from "../teams/TeamPageHero";
import { TeamDesktopTableShell } from "../teams/TeamDesktopTableControls";
import { formatLabel, normalizeValue } from "../teams/teamPage.utils";
import EventDirectoryMobileCards from "./EventDirectoryMobileCards";
import EventDirectoryTable from "./EventDirectoryTable";
import {
  EVENT_REGISTRATION_OPTIONS,
  EVENT_STATUS_OPTIONS,
  getEventCategoryLabel,
  getEventLevelLabel,
  getEventLocationLabel,
  getEventOrganizerLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationFilterValue,
  getEventRegistrationStatus,
  getEventStudentApplyLabel
} from "./events.constants";

const compactInputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-[#0f6cbd] focus:ring-4 focus:ring-[#0f6cbd]/10";

const compactSelectClass = `${compactInputClass} appearance-none pr-9`;

function StudentEventFilterBar({
  activeFilters,
  categoryFilter,
  categoryOptions,
  className = "",
  hasActiveFilters,
  levelFilter,
  levelOptions,
  onReset,
  query,
  registrationFilter,
  resultCount,
  setCategoryFilter,
  setLevelFilter,
  setQuery,
  setRegistrationFilter,
  setStatusFilter,
  showMeta = false,
  showReset = true,
  statusFilter,
  totalCount
}) {
  const showingText =
    totalCount > 0 ? `Showing ${resultCount} of ${totalCount} events` : `Showing ${resultCount} events`;

  const filterSummary =
    activeFilters.length > 0 ? activeFilters.join(" | ") : "No filters applied";

  return (
    <div className={className}>
      {showMeta ? (
        <div className="mb-3 flex flex-col gap-1 px-0.5">
          <p className="text-sm font-semibold text-slate-900">{showingText}</p>
          <p className="text-xs text-slate-500">{filterSummary}</p>
        </div>
      ) : null}

      <AdminFilterBar className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-center">
        <AdminSearchField
          value={query}
          onChangeValue={setQuery}
          placeholder="Search by code, event, organizer, category, location, or date"
          inputClassName={compactInputClass}
          wrapperClassName="relative w-full lg:min-w-[320px] lg:flex-1"
        />

        <AdminFilterSelect
          value={statusFilter}
          onChangeValue={setStatusFilter}
          wrapperClassName="relative w-full sm:w-[170px]"
          selectClassName={compactSelectClass}
        >
          <option value="ALL">All statuses</option>
          {EVENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={categoryFilter}
          onChangeValue={setCategoryFilter}
          wrapperClassName="relative w-full sm:w-[180px]"
          selectClassName={compactSelectClass}
        >
          <option value="ALL">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={levelFilter}
          onChangeValue={setLevelFilter}
          wrapperClassName="relative w-full sm:w-[170px]"
          selectClassName={compactSelectClass}
        >
          <option value="ALL">All levels</option>
          {levelOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </AdminFilterSelect>

        <AdminFilterSelect
          value={registrationFilter}
          onChangeValue={setRegistrationFilter}
          wrapperClassName="relative w-full sm:w-[190px]"
          selectClassName={compactSelectClass}
        >
          <option value="ALL">All registration</option>
          {EVENT_REGISTRATION_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </AdminFilterSelect>

        {showReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="inline-flex min-h-[38px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Clear Filters
          </button>
        ) : null}
      </AdminFilterBar>
    </div>
  );
}

export default function StudentEventsDirectoryPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [registrationFilter, setRegistrationFilter] = useState("ALL");

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

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((event) => getEventCategoryLabel(event))
            .filter((value) => value && value !== "-")
        )
      ).sort((left, right) => left.localeCompare(right)),
    [rows]
  );

  const levelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((event) => getEventLevelLabel(event))
            .filter((value) => value && value !== "-")
        )
      ).sort((left, right) => left.localeCompare(right)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return rows.filter((event) => {
      const categoryLabel = getEventCategoryLabel(event);
      const levelLabel = getEventLevelLabel(event);
      const organizerLabel = getEventOrganizerLabel(event);
      const registrationState = getEventRegistrationFilterValue(event);

      const matchesQuery =
        !normalizedQuery ||
        [
          event.event_code,
          event.event_name,
          organizerLabel,
          categoryLabel,
          levelLabel,
          event.location,
          event.status,
          event.description,
          event.registration_link,
          event.registration_start_date,
          event.registration_end_date,
          getEventRegistrationDateRangeLabel(event),
          getEventRegistrationStatus(event).label,
          registrationState,
          getEventStudentApplyLabel(event),
          getEventLocationLabel(event),
          event.start_date,
          event.end_date
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ")
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || normalizeValue(event.status) === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || categoryLabel === categoryFilter;
      const matchesLevel = levelFilter === "ALL" || levelLabel === levelFilter;
      const matchesRegistration =
        registrationFilter === "ALL" || registrationState === registrationFilter;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesCategory &&
        matchesLevel &&
        matchesRegistration
      );
    });
  }, [categoryFilter, levelFilter, query, registrationFilter, rows, statusFilter]);

  const activeFilters = useMemo(() => {
    const items = [];

    if (String(query || "").trim()) {
      items.push(`Search: ${String(query).trim()}`);
    }

    if (statusFilter !== "ALL") {
      items.push(`Status: ${formatLabel(statusFilter)}`);
    }

    if (categoryFilter !== "ALL") {
      items.push(`Category: ${categoryFilter}`);
    }

    if (levelFilter !== "ALL") {
      items.push(`Level: ${levelFilter}`);
    }

    if (registrationFilter !== "ALL") {
      items.push(`Registration: ${formatLabel(registrationFilter)}`);
    }

    return items;
  }, [categoryFilter, levelFilter, query, registrationFilter, statusFilter]);

  const resetFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setLevelFilter("ALL");
    setRegistrationFilter("ALL");
  }, []);

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
        description={headerSummary}
        actionLabel="Refresh events"
        actionBusyLabel="Refreshing..."
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <div className="p-3">
          <StudentEventFilterBar
            activeFilters={activeFilters}
            categoryFilter={categoryFilter}
            categoryOptions={categoryOptions}
            hasActiveFilters={activeFilters.length > 0}
            levelFilter={levelFilter}
            levelOptions={levelOptions}
            onReset={resetFilters}
            query={query}
            registrationFilter={registrationFilter}
            resultCount={filteredRows.length}
            setCategoryFilter={setCategoryFilter}
            setLevelFilter={setLevelFilter}
            setQuery={setQuery}
            setRegistrationFilter={setRegistrationFilter}
            setStatusFilter={setStatusFilter}
            showMeta
            showReset
            statusFilter={statusFilter}
            totalCount={rows.length}
          />
        </div>

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
          <StudentEventFilterBar
            activeFilters={activeFilters}
            categoryFilter={categoryFilter}
            categoryOptions={categoryOptions}
            className="w-full"
            hasActiveFilters={activeFilters.length > 0}
            levelFilter={levelFilter}
            levelOptions={levelOptions}
            onReset={resetFilters}
            query={query}
            registrationFilter={registrationFilter}
            resultCount={filteredRows.length}
            setCategoryFilter={setCategoryFilter}
            setLevelFilter={setLevelFilter}
            setQuery={setQuery}
            setRegistrationFilter={setRegistrationFilter}
            setStatusFilter={setStatusFilter}
            showReset={false}
            statusFilter={statusFilter}
            totalCount={rows.length}
          />
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
