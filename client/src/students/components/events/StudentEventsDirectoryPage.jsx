import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEvents } from "../../../service/events.api";
import { WorkspaceFilterBar } from "../../../shared/components/WorkspaceInlineFilters";
import TeamPageHero from "../teams/TeamPageHero";
import { TeamDesktopTableShell } from "../teams/TeamDesktopTableControls";
import { formatLabel, normalizeValue } from "../teams/teamPage.utils";
import EventDirectoryMobileCards from "./EventDirectoryMobileCards";
import EventDirectoryTable from "./EventDirectoryTable";
import {
  EVENT_REGISTRATION_OPTIONS,
  EVENT_STATUS_OPTIONS,
  getEventAllowedHubSummary,
  getEventHubRestrictionLabel,
  getEventCategoryLabel,
  getEventLevelLabel,
  getEventLocationLabel,
  getEventOrganizerLabel,
  getEventRegistrationModeLabel,
  getEventRegistrationDateRangeLabel,
  getEventRegistrationFilterValue,
  getEventRegistrationStatus,
  getEventStudentApplyLabel
} from "./events.constants";

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
          getEventRegistrationModeLabel(event),
          getEventHubRestrictionLabel(event),
          getEventAllowedHubSummary(event),
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
  const filterFields = useMemo(
    () => [
      {
        key: "query",
        type: "search",
        label: "Search",
        value: query,
        placeholder: "Search by code, event, host, category, location, or date",
        onChangeValue: setQuery
      },
      {
        key: "status",
        type: "select",
        label: "Status",
        value: statusFilter,
        onChangeValue: setStatusFilter,
        wrapperClassName: "w-full sm:w-[170px]",
        options: [
          { value: "ALL", label: "All statuses" },
          ...EVENT_STATUS_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      },
      {
        key: "category",
        type: "select",
        label: "Category",
        value: categoryFilter,
        onChangeValue: setCategoryFilter,
        wrapperClassName: "w-full sm:w-[180px]",
        options: [
          { value: "ALL", label: "All categories" },
          ...categoryOptions.map((category) => ({
            value: category,
            label: category
          }))
        ]
      },
      {
        key: "level",
        type: "select",
        label: "Level",
        value: levelFilter,
        onChangeValue: setLevelFilter,
        wrapperClassName: "w-full sm:w-[170px]",
        options: [
          { value: "ALL", label: "All levels" },
          ...levelOptions.map((level) => ({
            value: level,
            label: level
          }))
        ]
      },
      {
        key: "registration",
        type: "select",
        label: "Registration",
        value: registrationFilter,
        onChangeValue: setRegistrationFilter,
        wrapperClassName: "w-full sm:w-[190px]",
        options: [
          { value: "ALL", label: "All registration" },
          ...EVENT_REGISTRATION_OPTIONS.map((status) => ({
            value: status,
            label: formatLabel(status)
          }))
        ]
      }
    ],
    [
      categoryFilter,
      categoryOptions,
      levelFilter,
      levelOptions,
      query,
      registrationFilter,
      setCategoryFilter,
      setLevelFilter,
      setQuery,
      setRegistrationFilter,
      setStatusFilter,
      statusFilter
    ]
  );

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
      : `${rows.length} events currently available for participation`;

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
        eyebrow="Participation Directory"
        title="Event Listings"
        description={headerSummary}
        actionLabel="Refresh events"
        actionBusyLabel="Refreshing..."
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <WorkspaceFilterBar
        fields={filterFields}
        hasActiveFilters={activeFilters.length > 0}
        onReset={resetFilters}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden">
        <EventDirectoryMobileCards
          rows={filteredRows}
          loading={loading}
          onView={handleViewEvent}
        />
      </section>

      <TeamDesktopTableShell
        canReset={activeFilters.length > 0}
        onReset={resetFilters}
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
