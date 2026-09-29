import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChangeDayManagementSectionShell from "./ChangeDayManagementSectionShell";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1754cf] focus:bg-white focus:ring-4 focus:ring-[#1754cf]/10";

export default function ChangeDayManagementPhaseSettingsSection({
  minEndDate,
  onSave,
  saving,
  setSettingsForm,
  settingsForm
}) {
  return (
    <ChangeDayManagementSectionShell
      eyebrow="Step 2"
      icon={AccessTimeRoundedIcon}
      title="Refine The Daily Schedule"
      aside={
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Earliest End Date
            </p>
            <p className="mt-2 text-base font-black text-slate-900">{minEndDate || "-"}</p>
          </div>

          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Current Time Window
            </p>
            <p className="mt-2 text-base font-black text-slate-900">
              {settingsForm.start_time || "--:--"} - {settingsForm.end_time || "--:--"}
            </p>
          </div>
        </div>
      }
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl bg-[#1754cf] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? "Saving..." : "Save Phase Settings"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">End Date</span>
          <input
            type="date"
            value={settingsForm.end_date}
            min={minEndDate || undefined}
            onChange={(e) =>
              setSettingsForm((prev) => ({
                ...prev,
                end_date: e.target.value
              }))
            }
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Start Time</span>
          <input
            type="time"
            value={settingsForm.start_time}
            onChange={(e) =>
              setSettingsForm((prev) => ({
                ...prev,
                start_time: e.target.value
              }))
            }
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">End Time</span>
          <input
            type="time"
            value={settingsForm.end_time}
            onChange={(e) =>
              setSettingsForm((prev) => ({
                ...prev,
                end_time: e.target.value
              }))
            }
            className={inputClass}
          />
        </label>
      </div>
    </ChangeDayManagementSectionShell>
  );
}
