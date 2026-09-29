import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChangeDayManagementSectionShell from "./ChangeDayManagementSectionShell";

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1754cf] focus:bg-white focus:ring-4 focus:ring-[#1754cf]/10";

export default function ChangeDayManagementChangeDaySection({
  changeDayRange,
  formatDate,
  onSave,
  saving,
  selectedChangeDay,
  setSelectedChangeDay
}) {
  const helperText = changeDayRange.hasWindow
    ? `Allowed range: ${formatDate(changeDayRange.min)} - ${formatDate(changeDayRange.max)}`
    : "No valid change-day range available for this phase.";
  const selectionPreview = selectedChangeDay ? formatDate(selectedChangeDay) : "No date selected";

  return (
    <ChangeDayManagementSectionShell
      eyebrow="Step 1"
      icon={CalendarMonthRoundedIcon}
      title="Choose The Change Day"
      aside={
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Selection Preview
            </p>
            <p className="mt-2 text-base font-black text-slate-900">{selectionPreview}</p>
          </div>

          <div className="rounded-2xl border border-white bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Allowed Window
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">{helperText}</p>
          </div>
        </div>
      }
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !changeDayRange.hasWindow}
          className="rounded-2xl bg-[#1754cf] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? "Saving..." : "Save Change Day"}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Change Day Date</span>
          <input
            type="date"
            value={selectedChangeDay}
            min={changeDayRange.min || undefined}
            max={changeDayRange.max || undefined}
            onChange={(e) => setSelectedChangeDay(e.target.value)}
            disabled={!changeDayRange.hasWindow || saving}
            className={inputClass}
          />
        </label>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1754cf]/10 text-[#1754cf]">
            <InfoOutlinedIcon sx={{ fontSize: 20 }} />
          </div>
          <p className="text-sm font-medium leading-6 text-slate-600">{helperText}</p>
        </div>
      </div>
    </ChangeDayManagementSectionShell>
  );
}
