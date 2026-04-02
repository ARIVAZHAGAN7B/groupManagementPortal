import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import useClientPagination from "../../hooks/useClientPagination";
import {
  activateEvent,
  archiveEvent,
  closeEvent,
  createEvent,
  fetchEvents,
  updateEvent
} from "../../service/events.api";
import EventManagementDesktopTable from "../components/events/EventManagementDesktopTable";
import EventManagementFilters from "../components/events/EventManagementFilters";
import EventManagementFormCard from "../components/events/EventManagementFormCard";
import EventManagementHero from "../components/events/EventManagementHero";
import EventManagementMobileCards from "../components/events/EventManagementMobileCards";
import {
  DEFAULT_REWARD_ALLOCATION,
  DEFAULT_YEAR_REWARD_VALUES,
  formatRewardAllocationValue,
  parseRewardAllocationValues,
  filterEventRows
} from "../components/events/eventManagement.constants";
import AdminFormModal from "../components/ui/AdminFormModal";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";

type EventRow = {
  applied_count?: number | null;
  apply_by_student?: boolean | null;
  balance_count?: number | null;
  competition_name?: string | null;
  created_at?: string | null;
  country?: string | null;
  department?: string | null;
  description?: string | null;
  duration_days?: number | null;
  end_date?: string | null;
  eligible_for_rewards?: boolean | null;
  event_category?: string | null;
  event_code?: string | null;
  event_id: number;
  event_level?: string | null;
  event_name?: string | null;
  event_organizer?: string | null;
  location?: string | null;
  maximum_count?: number | null;
  max_members?: number | null;
  min_members?: number | null;
  registration_end_date?: string | null;
  registration_link?: string | null;
  registration_start_date?: string | null;
  related_to_special_lab?: boolean | null;
  reward_allocation?: string | null;
  selected_resources?: string | null;
  start_date?: string | null;
  state?: string | null;
  status?: string | null;
  team_count?: number | null;
  total_level_of_competition?: string | null;
  updated_at?: string | null;
  winner_rewards?: string | null;
  within_bit?: boolean | null;
};

type EventFormState = {
  applied_count: string;
  apply_by_student: string;
  competition_name: string;
  country: string;
  description: string;
  department: string;
  end_date: string;
  eligible_for_rewards: string;
  event_category: string;
  event_code: string;
  event_level: string;
  event_name: string;
  event_organizer: string;
  location: string;
  maximum_count: string;
  max_members: string;
  min_members: string;
  registration_end_date: string;
  registration_link: string;
  registration_start_date: string;
  related_to_special_lab: string;
  first_year_reward: string;
  fourth_year_reward: string;
  reward_allocation: string;
  second_year_reward: string;
  selected_resources: string;
  start_date: string;
  state: string;
  status: string;
  third_year_reward: string;
  total_level_of_competition: string;
  winner_rewards: string;
  within_bit: string;
};

const EMPTY_FORM: EventFormState = {
  applied_count: "",
  apply_by_student: "true",
  competition_name: "",
  country: "India",
  event_code: "",
  department: "",
  event_name: "",
  eligible_for_rewards: "false",
  event_category: "",
  event_level: "",
  event_organizer: "",
  first_year_reward: DEFAULT_YEAR_REWARD_VALUES.first_year_reward,
  fourth_year_reward: DEFAULT_YEAR_REWARD_VALUES.fourth_year_reward,
  location: "",
  maximum_count: "",
  registration_link: "",
  related_to_special_lab: "false",
  reward_allocation: DEFAULT_REWARD_ALLOCATION,
  second_year_reward: DEFAULT_YEAR_REWARD_VALUES.second_year_reward,
  selected_resources: "",
  start_date: "",
  end_date: "",
  registration_start_date: "",
  registration_end_date: "",
  min_members: "",
  max_members: "",
  state: "",
  status: "ACTIVE",
  third_year_reward: DEFAULT_YEAR_REWARD_VALUES.third_year_reward,
  total_level_of_competition: "",
  winner_rewards: "",
  within_bit: "false",
  description: ""
};

const toInputDate = (value: string | null | undefined) => (value ? String(value).slice(0, 10) : "");

const toInputNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const toIntegerString = (value: string | number | null | undefined, fallback = "") => {
  const match = String(value ?? "").match(/\d+/);
  return match ? match[0] : fallback;
};

const toInputBoolean = (
  value: boolean | number | string | null | undefined,
  fallback: "true" | "false"
) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return "true";
    if (["false", "0", "no", "n"].includes(normalized)) return "false";
  }

  return value ? "true" : "false";
};

const toFormState = (row: EventRow): EventFormState => {
  const rewardValues = parseRewardAllocationValues(row.reward_allocation);

  return {
    applied_count: toInputNumber(row.applied_count),
    apply_by_student: toInputBoolean(row.apply_by_student, "true"),
    competition_name: row.competition_name || "",
    country: row.country || "India",
    event_code: row.event_code || "",
    department: row.department || "",
    event_name: row.event_name || "",
    eligible_for_rewards: toInputBoolean(row.eligible_for_rewards, "false"),
    event_category: row.event_category || "",
    event_level: row.event_level || "",
    event_organizer: row.event_organizer || "",
    first_year_reward: rewardValues.first_year_reward,
    fourth_year_reward: rewardValues.fourth_year_reward,
    location: row.location || "",
    maximum_count: toInputNumber(row.maximum_count),
    registration_link: row.registration_link || "",
    related_to_special_lab: toInputBoolean(row.related_to_special_lab, "false"),
    reward_allocation:
      row.reward_allocation ||
      formatRewardAllocationValue(rewardValues) ||
      DEFAULT_REWARD_ALLOCATION,
    second_year_reward: rewardValues.second_year_reward,
    selected_resources: row.selected_resources || "",
    start_date: toInputDate(row.start_date),
    end_date: toInputDate(row.end_date),
    registration_start_date: toInputDate(row.registration_start_date),
    registration_end_date: toInputDate(row.registration_end_date),
    min_members: toInputNumber(row.min_members),
    max_members: toInputNumber(row.max_members),
    state: row.state || "",
    status: row.status || "ACTIVE",
    third_year_reward: rewardValues.third_year_reward,
    total_level_of_competition: row.total_level_of_competition || "",
    winner_rewards: toIntegerString(row.winner_rewards),
    within_bit: toInputBoolean(row.within_bit, "false"),
    description: row.description || ""
  };
};

const getUniqueTextOptions = (
  rows: EventRow[],
  accessor: (row: EventRow) => string | null | undefined
) =>
  Array.from(
    new Set(
      rows
        .map(accessor)
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

export default function EventManagement() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [applyByStudentFilter, setApplyByStudentFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
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

  const editingRow = useMemo(
    () => rows.find((row) => Number(row.event_id) === editingId) || null,
    [editingId, rows]
  );

  const categoryOptions = useMemo(
    () => getUniqueTextOptions(rows, (row) => row.event_category),
    [rows]
  );
  const levelOptions = useMemo(
    () => getUniqueTextOptions(rows, (row) => row.event_level),
    [rows]
  );
  const hasActiveFilters = useMemo(
    () =>
      Boolean(String(query || "").trim()) ||
      statusFilter !== "ALL" ||
      categoryFilter !== "ALL" ||
      levelFilter !== "ALL" ||
      applyByStudentFilter !== "ALL",
    [applyByStudentFilter, categoryFilter, levelFilter, query, statusFilter]
  );
  const filteredRows = useMemo(
    () =>
      filterEventRows(rows, {
        query,
        statusFilter,
        categoryFilter,
        levelFilter,
        studentFilter: applyByStudentFilter
      }),
    [applyByStudentFilter, categoryFilter, levelFilter, query, rows, statusFilter]
  );

  const {
    limit,
    page,
    pageCount,
    pagedItems: pagedRows,
    setLimit,
    setPage
  } = useClientPagination(filteredRows);

  useEffect(() => {
    setPage(1);
  }, [applyByStudentFilter, categoryFilter, levelFilter, query, setPage, statusFilter]);

  const handleResetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setLevelFilter("ALL");
    setApplyByStudentFilter("ALL");
  };

  const onChangeField = (key: keyof EventFormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleStartCreate = () => {
    resetForm();
    setError("");
    setSuccessMessage("");
    setFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setSuccessMessage("");
    setFormModalOpen(false);
  };

  const handleReset = () => {
    if (editingRow) {
      setForm(toFormState(editingRow));
      return;
    }

    setForm(EMPTY_FORM);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const rewardsEnabled = form.eligible_for_rewards === "true";
      const structuredRewardAllocation = formatRewardAllocationValue({
        first_year_reward: form.first_year_reward,
        second_year_reward: form.second_year_reward,
        third_year_reward: form.third_year_reward,
        fourth_year_reward: form.fourth_year_reward
      });

      const payload = {
        applied_count: form.applied_count ? Number(form.applied_count) : null,
        apply_by_student: form.apply_by_student === "true",
        competition_name: String(form.competition_name || "").trim(),
        country: String(form.country || "").trim(),
        event_code: String(form.event_code || "").trim().toUpperCase(),
        department: String(form.department || "").trim(),
        event_name: String(form.event_name || "").trim(),
        eligible_for_rewards: form.eligible_for_rewards === "true",
        event_category: String(form.event_category || "").trim(),
        event_level: String(form.event_level || "").trim(),
        event_organizer: String(form.event_organizer || "").trim(),
        location: String(form.location || "").trim(),
        maximum_count: form.maximum_count ? Number(form.maximum_count) : null,
        registration_link: String(form.registration_link || "").trim(),
        related_to_special_lab: form.related_to_special_lab === "true",
        reward_allocation:
          rewardsEnabled
            ? structuredRewardAllocation || String(form.reward_allocation || "").trim()
            : "",
        selected_resources: String(form.selected_resources || "").trim(),
        start_date: form.start_date || null,
        state: String(form.state || "").trim(),
        end_date: form.end_date || null,
        registration_start_date: form.registration_start_date || null,
        registration_end_date: form.registration_end_date || null,
        min_members: form.min_members ? Number(form.min_members) : null,
        max_members: form.max_members ? Number(form.max_members) : null,
        status: form.status,
        total_level_of_competition: String(form.total_level_of_competition || "").trim(),
        winner_rewards:
          rewardsEnabled && form.winner_rewards ? String(Number(form.winner_rewards)) : "",
        within_bit: form.within_bit === "true",
        description: String(form.description || "").trim()
      };

      if (!payload.event_code || !payload.event_name) {
        throw new Error("Event code and event name are required");
      }

      if (editingId) {
        await updateEvent(editingId, payload);
        setSuccessMessage(`Event ${payload.event_code} updated successfully.`);
      } else {
        await createEvent(payload);
        setSuccessMessage(`Event ${payload.event_code} created successfully.`);
      }

      resetForm();
      setFormModalOpen(false);
      await loadEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row: EventRow) => {
    setEditingId(Number(row.event_id));
    setForm(toFormState(row));
    setError("");
    setSuccessMessage("");
    setFormModalOpen(true);
  };

  const doRowAction = async (
    row: EventRow,
    action: (eventId: number) => Promise<any>,
    successText: string,
    confirmMessage?: string
  ) => {
    const eventId = Number(row.event_id);
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setActionBusyId(eventId);
    setError("");
    setSuccessMessage("");

    try {
      await action(eventId);
      setSuccessMessage(successText);
      await loadEvents();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 md:px-6">
      <EventManagementHero
        editingId={editingId}
        loading={loading}
        onRefresh={loadEvents}
        onStartCreate={handleStartCreate}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <AdminFormModal
        busy={saving}
        onClose={handleCancelEdit}
        open={formModalOpen}
      >
        <EventManagementFormCard
          editingId={editingId}
          form={form}
          onCancelEdit={handleCancelEdit}
          onChangeField={onChangeField}
          onReset={handleReset}
          onSubmit={onSubmit}
          saving={saving}
        />
      </AdminFormModal>

      <EventManagementFilters
        applyByStudentFilter={applyByStudentFilter}
        categoryFilter={categoryFilter}
        categoryOptions={categoryOptions}
        hasActiveFilters={hasActiveFilters}
        levelFilter={levelFilter}
        levelOptions={levelOptions}
        onResetFilters={handleResetFilters}
        query={query}
        setApplyByStudentFilter={setApplyByStudentFilter}
        setCategoryFilter={setCategoryFilter}
        setLevelFilter={setLevelFilter}
        setQuery={setQuery}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
      />

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
          Loading events...
        </div>
      ) : (
        <>
          <EventManagementMobileCards
            actionBusyId={actionBusyId}
            onActivate={(row) =>
              doRowAction(
                row,
                activateEvent,
                `Event ${row.event_code || row.event_id} is now ACTIVE.`
              )
            }
            onArchive={(row) =>
              doRowAction(
                row,
                archiveEvent,
                `Event ${row.event_code || row.event_id} has been archived.`,
                `Archive event ${row.event_code || row.event_id}?`
              )
            }
            onClose={(row) =>
              doRowAction(
                row,
                closeEvent,
                `Event ${row.event_code || row.event_id} is now CLOSED.`
              )
            }
            onEdit={onEdit}
            onView={(row) => navigate(`/event-management/${row.event_id}`)}
            rows={pagedRows}
          />

          <EventManagementDesktopTable
            actionBusyId={actionBusyId}
            onActivate={(row) =>
              doRowAction(
                row,
                activateEvent,
                `Event ${row.event_code || row.event_id} is now ACTIVE.`
              )
            }
            onArchive={(row) =>
              doRowAction(
                row,
                archiveEvent,
                `Event ${row.event_code || row.event_id} has been archived.`,
                `Archive event ${row.event_code || row.event_id}?`
              )
            }
            onClose={(row) =>
              doRowAction(
                row,
                closeEvent,
                `Event ${row.event_code || row.event_id} is now CLOSED.`
              )
            }
            onEdit={onEdit}
            onView={(row) => navigate(`/event-management/${row.event_id}`)}
            rows={pagedRows}
          />
        </>
      )}

      <AdminPaginationBar
        itemLabel="events"
        limit={limit}
        loading={loading}
        onLimitChange={setLimit}
        onPageChange={setPage}
        page={page}
        pageCount={pageCount}
        shownCount={pagedRows.length}
        totalCount={filteredRows.length}
      />
    </div>
  );
}
