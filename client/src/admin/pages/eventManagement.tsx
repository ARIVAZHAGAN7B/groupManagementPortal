import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import useClientPagination from "../../hooks/useClientPagination";
import {
  activateEvent,
  archiveEvent,
  closeEvent,
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent
} from "../../service/events.api";
import EventManagementDesktopTable from "../components/events/EventManagementDesktopTable";
import EventManagementFilters from "../components/events/EventManagementFilters";
import EventManagementFormCard from "../components/events/EventManagementFormCard";
import EventManagementHero from "../components/events/EventManagementHero";
import EventManagementMobileCards from "../components/events/EventManagementMobileCards";
import { filterEventRows } from "../components/events/eventManagement.constants";
import AdminFormModal from "../components/ui/AdminFormModal";
import AdminPaginationBar from "../components/ui/AdminPaginationBar";

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

const toInputDate = (value: string | null | undefined) => (value ? String(value).slice(0, 10) : "");

const toInputNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const toFormState = (row: EventRow): EventFormState => ({
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

export default function EventManagement() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
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

  const filteredRows = useMemo(
    () => filterEventRows(rows, { query, statusFilter }),
    [query, rows, statusFilter]
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
  }, [query, setPage, statusFilter]);

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
        filteredCount={filteredRows.length}
        query={query}
        setQuery={setQuery}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
        totalCount={rows.length}
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
            onDeactivate={(row) =>
              doRowAction(
                row,
                deleteEvent,
                `Event ${row.event_code || row.event_id} has been set to INACTIVE.`,
                `Set event ${row.event_code || row.event_id} to INACTIVE?`
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
            onDeactivate={(row) =>
              doRowAction(
                row,
                deleteEvent,
                `Event ${row.event_code || row.event_id} has been set to INACTIVE.`,
                `Set event ${row.event_code || row.event_id} to INACTIVE?`
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
