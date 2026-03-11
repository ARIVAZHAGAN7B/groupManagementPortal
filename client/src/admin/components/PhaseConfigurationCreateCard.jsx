import { addDaysToDateInput } from "./PhaseConfigurationUtils";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10";

export default function PhaseConfigurationCreateCard({
  canCreate,
  createLoading,
  form,
  onSubmit,
  setForm,
  workingDaysAuto,
  workingDaysError,
  workingDaysHolidayCount,
  workingDaysLoading
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900">Create Phase</h2>
      </div>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <label className="col-span-full block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Phase Name</span>
            <input
              type="text"
              value={form.phase_name}
              onChange={(e) => setForm((prev) => ({ ...prev, phase_name: e.target.value }))}
              className={inputClass}
              placeholder="e.g., Phase 1"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Start Date</span>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">
              End Date (Optional)
            </span>
            <input
              type="date"
              value={form.end_date}
              min={addDaysToDateInput(form.start_date, 1) || undefined}
              onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">
              No. of Working Days
            </span>
            <input
              type="number"
              min={1}
              value={form.total_working_days}
              readOnly={workingDaysAuto}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, total_working_days: e.target.value }))
              }
              className={`${inputClass} ${workingDaysAuto ? "cursor-default bg-slate-100 text-slate-500" : ""}`}
              placeholder="10"
            />
            <span className="mt-1 block text-xs text-slate-500">
              {workingDaysLoading
                ? "Checking holidays and calculating working days..."
                : workingDaysError
                  ? workingDaysError
                  : workingDaysAuto
                    ? `Auto-calculated from the selected date range after excluding ${workingDaysHolidayCount} holiday(s).`
                    : "Defaults to 10 when end date is not configured."}
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">
              Change Day Number
            </span>
            <input
              type="number"
              min={1}
              value={form.change_day_number}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, change_day_number: e.target.value }))
              }
              className={inputClass}
              placeholder="0"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">Start Time</span>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              className={inputClass}
            />
          </label>

          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm font-semibold text-slate-900">End Time</span>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={!canCreate || createLoading}
            className="rounded-lg bg-[#1754cf] px-8 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#1549b1] disabled:cursor-not-allowed disabled:bg-[#1754cf]/60 disabled:shadow-none"
          >
            {createLoading ? "Creating..." : "Create Phase"}
          </button>
        </div>
      </form>
    </section>
  );
}
