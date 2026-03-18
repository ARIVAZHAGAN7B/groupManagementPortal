import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import GroupManagementActionModal from "../components/groups/GroupManagementActionModal";
import { inputClass } from "../components/groups/groupManagement.constants";
import {
  createHoliday,
  deleteHoliday,
  fetchHolidayById,
  fetchHolidays,
  updateHoliday
} from "../../service/systemConfig.api";

const toDateOnlyLocal = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayDateOnly = () => toDateOnlyLocal();

const defaultForm = {
  holiday_date: "",
  holiday_name: "",
  description: ""
};

const parseDateOnly = (value) => {
  const normalized = String(value || "").trim();
  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;

  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3])
  );
};

const formatDate = (value) => {
  const parsed = parseDateOnly(value) || new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "-";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
};

function StatPill({ accentClass, detail, label, value }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${accentClass}`} />
        <p className="text-sm font-semibold text-slate-700">
          {label}: <span className="text-slate-900">{value}</span>
        </p>
      </div>
      <p className="mt-1 pl-4 text-[11px] font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function HolidayManagementHero({ loading, onRefresh, stats }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1754cf]/10 bg-[#1754cf]/5 p-4 md:p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
              Calendar Workspace
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Holiday Management
              </h1>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Manage holidays used by working-day calculations.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatPill
            accentClass="bg-[#1754cf]"
            detail="All configured holidays"
            label="Total"
            value={stats.total}
          />
          <StatPill
            accentClass="bg-emerald-500"
            detail="Today and later"
            label="Upcoming"
            value={stats.upcoming}
          />
          <StatPill
            accentClass="bg-amber-500"
            detail="Already passed"
            label="Past"
            value={stats.past}
          />
          <StatPill
            accentClass="bg-sky-500"
            detail="In the current year"
            label="This Year"
            value={stats.currentYear}
          />
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-[#1754cf]/10 blur-3xl" />
    </section>
  );
}

function StatusBanner({ message, tone }) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass}`}>
      {message}
    </div>
  );
}

function HolidayFormModal({
  busy,
  form,
  onCancel,
  onChange,
  onSubmit,
  open
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
      <button
        type="button"
        aria-label="Close holiday editor"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.24)]">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#1754cf]">
            Holiday Form
          </span>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Update holiday</h3>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Date</span>
            <input
              type="date"
              className={inputClass}
              value={form.holiday_date}
              onChange={(event) => onChange("holiday_date", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Name</span>
            <input
              type="text"
              className={inputClass}
              value={form.holiday_name}
              onChange={(event) => onChange("holiday_name", event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Description</span>
            <textarea
              className={`${inputClass} min-h-24 resize-y py-3`}
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
            />
          </label>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              <SaveRoundedIcon sx={{ fontSize: 18 }} />
              {busy ? "Saving..." : "Update Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HolidayCard({ holiday, onDelete, onEdit, deleteBusy, editBusy }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-900">{holiday.holiday_name}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(holiday.holiday_date)}</p>
        </div>

        <span className="rounded-full bg-[#1754cf]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1754cf]">
          Holiday
        </span>
      </div>

      {holiday.description ? (
        <p className="mt-3 text-xs leading-5 text-slate-600">{holiday.description}</p>
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onEdit(holiday)}
          disabled={editBusy || deleteBusy}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <EditRoundedIcon sx={{ fontSize: 16 }} />
          {editBusy ? "Loading..." : "Edit"}
        </button>

        <button
          type="button"
          onClick={() => onDelete(holiday)}
          disabled={deleteBusy || editBusy}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalLoadingId, setModalLoadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [editState, setEditState] = useState({
    open: false,
    holidayId: null,
    form: defaultForm
  });
  const [deleteState, setDeleteState] = useState({
    open: false,
    holiday: null
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHolidays();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load holidays");
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredHolidays = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();
    if (!query) return holidays;

    return holidays.filter((holiday) =>
      [holiday.holiday_date, holiday.holiday_name, holiday.description]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [holidays, q]);

  const stats = useMemo(() => {
    const today = todayDateOnly();
    const all = Array.isArray(holidays) ? holidays : [];
    return {
      total: all.length,
      upcoming: all.filter((holiday) => String(holiday?.holiday_date || "") >= today).length,
      past: all.filter((holiday) => String(holiday?.holiday_date || "") < today).length,
      currentYear: all.filter(
        (holiday) => String(holiday?.holiday_date || "").slice(0, 4) === today.slice(0, 4)
      ).length
    };
  }, [holidays]);

  const resetForm = () => {
    setForm(defaultForm);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.holiday_date || !String(form.holiday_name || "").trim()) {
      setError("Holiday date and name are required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        holiday_date: form.holiday_date,
        holiday_name: String(form.holiday_name || "").trim(),
        description: String(form.description || "").trim()
      };

      await createHoliday(payload);
      setSuccess("Holiday added.");

      await load();
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = async (holiday) => {
    setError("");
    setSuccess("");
    setModalLoadingId(holiday.holiday_id);

    try {
      const latestHoliday = await fetchHolidayById(holiday.holiday_id);
      setEditState({
        open: true,
        holidayId: holiday.holiday_id,
        form: {
          holiday_date: latestHoliday?.holiday_date || holiday.holiday_date || "",
          holiday_name: latestHoliday?.holiday_name || holiday.holiday_name || "",
          description: latestHoliday?.description || holiday.description || ""
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load holiday details");
    } finally {
      setModalLoadingId(null);
    }
  };

  const closeEditModal = (force = false) => {
    if (modalSaving && !force) return;
    setEditState({
      open: false,
      holidayId: null,
      form: defaultForm
    });
  };

  const onEditFieldChange = (field, value) => {
    setEditState((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value
      }
    }));
  };

  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!editState.holidayId) return;

    if (
      !editState.form.holiday_date ||
      !String(editState.form.holiday_name || "").trim()
    ) {
      setError("Holiday date and name are required.");
      return;
    }

    setModalSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateHoliday(editState.holidayId, {
        holiday_date: editState.form.holiday_date,
        holiday_name: String(editState.form.holiday_name || "").trim(),
        description: String(editState.form.description || "").trim()
      });
      setSuccess("Holiday updated.");
      await load();
      closeEditModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update holiday");
    } finally {
      setModalSaving(false);
    }
  };

  const openDeleteModal = (holiday) => {
    setDeleteState({
      open: true,
      holiday
    });
    setError("");
    setSuccess("");
  };

  const closeDeleteModal = (force = false) => {
    if (deletingId && !force) return;
    setDeleteState({
      open: false,
      holiday: null
    });
  };

  const onDeleteConfirm = async () => {
    const holiday = deleteState.holiday;
    if (!holiday?.holiday_id) return;

    setDeletingId(holiday.holiday_id);
    setError("");
    setSuccess("");
    try {
      await deleteHoliday(holiday.holiday_id);
      setSuccess("Holiday deleted.");
      await load();
      closeDeleteModal(true);
      if (editState.holidayId === holiday.holiday_id) {
        closeEditModal(true);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete holiday");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 font-[Inter] text-slate-900 md:px-6">
      <HolidayManagementHero loading={loading} onRefresh={load} stats={stats} />

      {error ? <StatusBanner tone="error" message={error} /> : null}
      {success ? <StatusBanner tone="success" message={success} /> : null}

      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-[#1754cf]">
                Holiday Form
              </span>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Add holiday
              </h2>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Date</span>
              <input
                type="date"
                className={inputClass}
                value={form.holiday_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, holiday_date: event.target.value }))
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">Holiday Name</span>
              <input
                type="text"
                className={inputClass}
                value={form.holiday_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, holiday_name: event.target.value }))
                }
                placeholder="e.g. Republic Day"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">Description</span>
              <textarea
                className={`${inputClass} min-h-24 resize-y py-3`}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Optional note"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1754cf] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1754cf]/20 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              <AddRoundedIcon sx={{ fontSize: 18 }} />
              {saving ? "Saving..." : "Add Holiday"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <SearchRoundedIcon
                sx={{ fontSize: 20 }}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Search holidays"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
              Loading holidays...
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500 shadow-sm">
              No holidays found.
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:hidden">
                {filteredHolidays.map((holiday) => (
                  <HolidayCard
                    key={holiday.holiday_id}
                    holiday={holiday}
                    onDelete={openDeleteModal}
                    onEdit={openEditModal}
                    deleteBusy={deletingId === holiday.holiday_id}
                    editBusy={modalLoadingId === holiday.holiday_id}
                  />
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Holiday
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Description
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredHolidays.map((holiday) => (
                      <tr key={holiday.holiday_id} className="hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#1754cf]/10 px-2.5 py-1 text-xs font-semibold text-[#1754cf]">
                            <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />
                            {formatDate(holiday.holiday_date)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                          {holiday.holiday_name}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {holiday.description || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(holiday)}
                              disabled={
                                modalLoadingId === holiday.holiday_id ||
                                deletingId === holiday.holiday_id
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                            >
                              <EditRoundedIcon sx={{ fontSize: 16 }} />
                              {modalLoadingId === holiday.holiday_id ? "Loading..." : "Edit"}
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(holiday)}
                              disabled={deletingId === holiday.holiday_id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-70"
                            >
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      <HolidayFormModal
        busy={modalSaving}
        form={editState.form}
        onCancel={closeEditModal}
        onChange={onEditFieldChange}
        onSubmit={onEditSubmit}
        open={editState.open}
      />

      <GroupManagementActionModal
        busy={Boolean(deletingId)}
        cancelLabel="Cancel"
        confirmLabel="Delete Holiday"
        message={
          deleteState.holiday
            ? `Delete ${deleteState.holiday.holiday_name} on ${formatDate(deleteState.holiday.holiday_date)}?`
            : ""
        }
        mode="confirm"
        onCancel={closeDeleteModal}
        onConfirm={onDeleteConfirm}
        open={deleteState.open}
        title="Delete holiday?"
        tone="danger"
      />
    </section>
  );
}
