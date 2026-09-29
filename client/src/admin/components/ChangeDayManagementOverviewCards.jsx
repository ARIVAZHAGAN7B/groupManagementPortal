import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const sumConfiguredTargets = (targets = []) =>
  (Array.isArray(targets) ? targets : []).reduce((total, row) => {
    if (!hasValue(row?.group_target)) return total;
    const numericValue = Number(row.group_target);
    return Number.isFinite(numericValue) ? total + numericValue : total;
  }, 0);

const getConfiguredTargetCount = (targets = []) =>
  (Array.isArray(targets) ? targets : []).filter((row) => hasValue(row?.group_target)).length;

const buildChangeWindowLabel = (changeDayRange, formatDate) => {
  if (!changeDayRange?.hasWindow) return "Window opens after the phase has started.";
  return `${formatDate(changeDayRange.min)} - ${formatDate(changeDayRange.max)}`;
};

export default function ChangeDayManagementOverviewCards({
  changeDayRange,
  currentPhase,
  formatDate,
  individualTarget,
  settingsForm,
  targets
}) {
  const configuredTargetCount = getConfiguredTargetCount(targets);
  const totalGroupTarget = sumConfiguredTargets(targets);
  const phaseName = currentPhase?.phase_name || currentPhase?.phase_id || "No active phase";
  const workingDays = Number(currentPhase?.total_working_days);
  const workingDaysLabel =
    Number.isFinite(workingDays) && workingDays >= 0
      ? `${workingDays} working days`
      : "Working days not set";

  const cards = [
    {
      label: "Active Phase",
      value: phaseName,
      detail: `${formatDate(currentPhase?.start_date)} - ${formatDate(currentPhase?.end_date)}`,
      meta: `${String(currentPhase?.status || "inactive").toUpperCase()} | ${workingDaysLabel}`,
      icon: CalendarMonthRoundedIcon,
      iconClassName: "bg-[#1754cf]/10 text-[#1754cf]"
    },
    {
      label: "Change Day",
      value: currentPhase?.change_day ? formatDate(currentPhase.change_day) : "Not set",
      detail: `Allowed window: ${buildChangeWindowLabel(changeDayRange, formatDate)}`,
      meta: hasValue(currentPhase?.change_day_number)
        ? `Current change-day number: ${currentPhase.change_day_number}`
        : "Pick a date inside the allowed window.",
      icon: TrackChangesRoundedIcon,
      iconClassName: "bg-emerald-100 text-emerald-600"
    },
    {
      label: "Schedule Window",
      value:
        settingsForm?.start_time && settingsForm?.end_time
          ? `${settingsForm.start_time} - ${settingsForm.end_time}`
          : "Time range not set",
      detail: `Phase end date: ${formatDate(settingsForm?.end_date || currentPhase?.end_date)}`,
      meta: currentPhase?.start_time && currentPhase?.end_time
        ? `Saved hours: ${currentPhase.start_time} - ${currentPhase.end_time}`
        : "Daily operating hours can be updated here.",
      icon: ScheduleRoundedIcon,
      iconClassName: "bg-amber-100 text-amber-600"
    },
    {
      label: "Targets",
      value:
        configuredTargetCount > 0
          ? `${configuredTargetCount}/${targets.length} tier targets ready`
          : "No tier targets set",
      detail:
        totalGroupTarget > 0
          ? `${totalGroupTarget} total group target units configured`
          : "Add group thresholds for each tier.",
      meta: hasValue(individualTarget)
        ? `Individual target: ${individualTarget} units`
        : "Individual target not set",
      icon: FlagRoundedIcon,
      iconClassName: "bg-sky-100 text-sky-600"
    }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]"
          >
            <div className="relative z-10 space-y-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconClassName}`}
              >
                <Icon sx={{ fontSize: 24 }} />
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  {card.label}
                </p>
                <p className="text-lg font-black leading-tight text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500">{card.detail}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {card.meta}
              </div>
            </div>

            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100 blur-2xl" />
          </article>
        );
      })}
    </div>
  );
}
