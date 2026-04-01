import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import {
  EVENT_STATUSES,
  REGISTRATION_STATE_STYLES,
  STATUS_STYLES,
  formatDateRange,
  getRegistrationState,
  inputClass,
  selectClass
} from "./eventManagement.constants";
import { AdminBadge, AdminMappedBadge } from "../ui/AdminUiPrimitives";

export default function EventManagementFormCard({
  editingId,
  form,
  onCancelEdit,
  onChangeField,
  onReset,
  onSubmit,
  saving
}) {
  const registrationState = getRegistrationState(
    form.registration_start_date,
    form.registration_end_date
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1754cf]">
            {editingId ? "Edit Event" : "Create Event"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {editingId ? `Update Event #${editingId}` : "Add a New Event"}
            </h2>
            <AdminMappedBadge
              map={STATUS_STYLES}
              value={form.status}
              className="px-3 py-1 text-[10px]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onCancelEdit}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {editingId ? "Cancel Edit" : "Close"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Event Code
            </label>
            <input
              value={form.event_code}
              onChange={(event) => onChangeField("event_code", event.target.value)}
              className={inputClass}
              placeholder="HACK2026"
              maxLength={50}
            />
          </div>

          <div className="xl:col-span-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Event Name
            </label>
            <input
              value={form.event_name}
              onChange={(event) => onChangeField("event_name", event.target.value)}
              className={inputClass}
              placeholder="Hackathon 2026"
              maxLength={150}
            />
          </div>

          <div className="xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Location
            </label>
            <input
              value={form.location}
              onChange={(event) => onChangeField("location", event.target.value)}
              className={inputClass}
              placeholder="Main Auditorium"
              maxLength={255}
            />
          </div>

          <div className="xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Registration Link
            </label>
            <input
              value={form.registration_link}
              onChange={(event) => onChangeField("registration_link", event.target.value)}
              className={inputClass}
              placeholder="https://example.com/register"
              maxLength={500}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Event Start
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(event) => onChangeField("start_date", event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Event End
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(event) => onChangeField("end_date", event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Registration Start
            </label>
            <input
              type="date"
              value={form.registration_start_date}
              onChange={(event) =>
                onChangeField("registration_start_date", event.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Registration End
            </label>
            <input
              type="date"
              value={form.registration_end_date}
              onChange={(event) =>
                onChangeField("registration_end_date", event.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Min Members
            </label>
            <input
              type="number"
              min={1}
              value={form.min_members}
              onChange={(event) => onChangeField("min_members", event.target.value)}
              className={inputClass}
              placeholder="3"
            />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Max Members
            </label>
            <input
              type="number"
              min={1}
              value={form.max_members}
              onChange={(event) => onChangeField("max_members", event.target.value)}
              className={inputClass}
              placeholder="6"
            />
          </div>

          <div className="xl:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Status
            </label>
            <div className="relative">
              <select
                value={form.status}
                onChange={(event) => onChangeField("status", event.target.value)}
                className={selectClass}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2 xl:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Registration Snapshot
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AdminBadge
                className={`px-3 py-1 text-[10px] ${REGISTRATION_STATE_STYLES[registrationState.key]}`}
              >
                {registrationState.label}
              </AdminBadge>
              <span className="text-xs font-medium text-slate-500">
                {formatDateRange(form.registration_start_date, form.registration_end_date)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(event) => onChangeField("description", event.target.value)}
            className={`${inputClass} min-h-[140px] resize-y`}
            placeholder="Describe the event goals, audience, format, or operational notes."
            maxLength={1000}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#0f6cbd] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0f6cbd]/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
          </button>
        </div>
      </form>
    </section>
  );
}
