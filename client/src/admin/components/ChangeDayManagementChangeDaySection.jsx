import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ChangeDayManagementSectionShell from "./ChangeDayManagementSectionShell";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1754cf] focus:ring-4 focus:ring-[#1754cf]/10";

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

  return (
    <ChangeDayManagementSectionShell
      title="Update Change Day"
      description="Pick a date within the allowed range. Change day count updates automatically."
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !changeDayRange.hasWindow}
          className="rounded-lg bg-[#1754cf] px-6 py-2.5 text-sm font-bold text-white shadow-[0_18px_40px_rgba(23,84,207,0.22)] transition-all hover:bg-[#154ab4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving ? "Saving..." : "Save Change Day"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4">
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

        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <InfoOutlinedIcon sx={{ fontSize: 20 }} className="text-[#1754cf]" />
          <p className="text-sm font-medium text-slate-600">{helperText}</p>
        </div>
      </div>
    </ChangeDayManagementSectionShell>
  );
}
